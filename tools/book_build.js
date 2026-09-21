#!/usr/bin/env node
/**
 * Build the پرامپتولوژیست book manuscript (.docx) from book_extract.py's JSON.
 *
 * The whole point of this file is bidirectional correctness. Word stores text
 * direction as explicit attributes, so every paragraph carries w:bidi and every
 * Persian run carries w:rtl (plus w:bCs/w:szCs, which are what actually bold
 * and size complex-script text). Latin words are split into their own runs and
 * deliberately NOT marked rtl, so Word picks the Latin font for them instead of
 * the Persian one. No direction-mark characters (LRM/RLM) are inserted anywhere:
 * with the base direction set correctly the Unicode bidi algorithm places the
 * neutral punctuation on its own, and marks sprinkled into the text would only
 * survive until the first edit.
 *
 * Requires the `docx` npm package (npm install docx; NODE_PATH=... if it is
 * installed outside this repo — nothing here is added to the site itself).
 *
 * Usage: node tools/book_build.js <book.json> <img-dir> <out.docx>
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType,
  PageBreak, Footer, PageNumber, TableOfContents, LevelFormat, convertMillimetersToTwip,
} = require('docx');

const FA_FONT = process.env.BOOK_FA_FONT || 'Tahoma';
const LA_FONT = process.env.BOOK_LA_FONT || 'Tahoma';

const [, , jsonPath, imgDir, outPath] = process.argv;
const book = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

/* ---------------------------------------------------------------- runs ---- */

// A maximal stretch of Latin script (letters, and the digits/punctuation held
// inside it, e.g. "GPT-4o", "Redeem Gift Card or Code"). It must end on an
// alphanumeric so a trailing space is left to the Persian run beside it.
const LATIN = /[A-Za-z][A-Za-z0-9 .,'’&\-_/+#:]*[A-Za-z0-9]|[A-Za-z]/g;

const faRun = (text, bold) => new TextRun({
  text,
  bold, boldComplexScript: bold,
  rightToLeft: true,
  font: { ascii: LA_FONT, hAnsi: LA_FONT, cs: FA_FONT },
});

const laRun = (text, bold) => new TextRun({
  text,
  bold,
  rightToLeft: false,
  font: { ascii: LA_FONT, hAnsi: LA_FONT, cs: FA_FONT },
});

/** Split one piece of text into script-homogeneous runs. Adds/removes nothing. */
function splitRuns(text, bold) {
  const out = [];
  let last = 0;
  LATIN.lastIndex = 0;
  let m;
  while ((m = LATIN.exec(text)) !== null) {
    if (m.index > last) out.push(faRun(text.slice(last, m.index), bold));
    out.push(laRun(m[0], bold));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(faRun(text.slice(last), bold));
  return out.length ? out : [faRun(text, bold)];
}

/** Guard: the runs of a paragraph must reassemble into the source text exactly. */
let checkedChars = 0;
function runsFor(blockRuns) {
  const children = [];
  let rebuilt = '';
  let source = '';
  blockRuns.forEach((r) => {
    if (r.break_before) children.push(new TextRun({ break: 1 }));
    source += r.text;
    splitRuns(r.text, r.bold).forEach((tr) => children.push(tr));
    rebuilt += r.text;
  });
  if (rebuilt !== source) throw new Error('run split changed the text');
  checkedChars += source.length;
  return children;
}

/* ------------------------------------------------------------ paragraph --- */

const BODY = {
  bidirectional: true,
  alignment: AlignmentType.JUSTIFIED,
  spacing: { line: 360, after: 0 },
  indent: { firstLine: convertMillimetersToTwip(6) },
};

const body = (blockRuns) => new Paragraph({ ...BODY, children: runsFor(blockRuns) });

const plain = (text, opts = {}) => new Paragraph({
  bidirectional: true,
  alignment: opts.alignment || AlignmentType.RIGHT,
  spacing: opts.spacing || { before: 120, after: 120 },
  children: splitRuns(text, !!opts.bold).map((r) => r),
  ...(opts.heading ? { heading: opts.heading } : {}),
});

/* --------------------------------------------------------------- images --- */

function figure(src, caption) {
  const file = path.join(imgDir, path.basename(src).replace(/\.webp$/, '.png'));
  const out = [];
  if (fs.existsSync(file)) {
    // Fit inside the text column without ever upscaling a screenshot.
    const dim = require('child_process').execSync(
      `python3 -c "from PIL import Image;im=Image.open('${file}');print(im.size[0],im.size[1])"`,
    ).toString().trim().split(' ').map(Number);
    const maxW = 380, maxH = 500;
    const scale = Math.min(maxW / dim[0], maxH / dim[1], 1);
    out.push(new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [new ImageRun({
        type: 'png',
        data: fs.readFileSync(file),
        transformation: { width: Math.round(dim[0] * scale), height: Math.round(dim[1] * scale) },
      })],
    }));
  }
  if (caption) {
    out.push(new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: splitRuns(caption, false).map((r) => r),
    }));
  }
  return out;
}

/* -------------------------------------------------------------- document -- */

const children = [];

// Title page
children.push(
  new Paragraph({ spacing: { before: 2400 }, children: [] }),
  new Paragraph({
    bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({
      text: 'پرامپتولوژیست', rightToLeft: true, bold: true, boldComplexScript: true,
      size: 56, sizeComplexScript: 56,
      font: { ascii: LA_FONT, hAnsi: LA_FONT, cs: FA_FONT },
    })],
  }),
  new Paragraph({
    bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 1200 },
    children: splitRuns('کار با هوش مصنوعی در دندان‌پزشکی', false).map((r) => r),
  }),
  new Paragraph({
    bidirectional: true, alignment: AlignmentType.CENTER,
    children: splitRuns('دکتر فواد شهابیان', false).map((r) => r),
  }),
  new Paragraph({ children: [new PageBreak()] }),
);

// Contents
children.push(
  new Paragraph({
    bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 240 },
    children: [new TextRun({
      text: 'فهرست', rightToLeft: true, bold: true, boldComplexScript: true,
      size: 32, sizeComplexScript: 32,
      font: { ascii: LA_FONT, hAnsi: LA_FONT, cs: FA_FONT },
    })],
  }),
  new TableOfContents('فهرست', { hyperlink: true, headingStyleRange: '1-2' }),
  new Paragraph({ children: [new PageBreak()] }),
);

let chapter = null;
book.parts.forEach((part) => {
  if (part.chapter && part.chapter !== chapter) {
    chapter = part.chapter;
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(plain(chapter, {
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 360 },
    }));
  }
  const head = part.badge ? `${part.badge} — ${part.title}` : part.title;
  children.push(plain(head, {
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 200 },
  }));
  part.blocks.forEach((b) => {
    if (b.type === 'p') children.push(body(b.runs));
    else if (b.type === 'figure') figure(b.src, b.caption).forEach((p) => children.push(p));
  });
});

const doc = new Document({
  creator: 'دکتر فواد شهابیان',
  title: 'پرامپتولوژیست',
  features: { updateFields: true },
  styles: {
    default: {
      document: {
        run: {
          size: 24, sizeComplexScript: 24, rightToLeft: true,
          font: { ascii: LA_FONT, hAnsi: LA_FONT, cs: FA_FONT },
        },
        paragraph: { bidirectional: true, alignment: AlignmentType.JUSTIFIED },
      },
      heading1: {
        run: {
          size: 36, sizeComplexScript: 36, bold: true, boldComplexScript: true,
          color: '000000', rightToLeft: true,
          font: { ascii: LA_FONT, hAnsi: LA_FONT, cs: FA_FONT },
        },
        paragraph: { bidirectional: true, alignment: AlignmentType.RIGHT },
      },
      heading2: {
        run: {
          size: 28, sizeComplexScript: 28, bold: true, boldComplexScript: true,
          color: '000000', rightToLeft: true,
          font: { ascii: LA_FONT, hAnsi: LA_FONT, cs: FA_FONT },
        },
        paragraph: { bidirectional: true, alignment: AlignmentType.RIGHT },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertMillimetersToTwip(25), bottom: convertMillimetersToTwip(25),
          left: convertMillimetersToTwip(22), right: convertMillimetersToTwip(22),
        },
      },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            children: [PageNumber.CURRENT],
            rightToLeft: true,
            font: { ascii: LA_FONT, hAnsi: LA_FONT, cs: FA_FONT },
            size: 20, sizeComplexScript: 20,
          })],
        })],
      }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log(`${outPath} · ${(buf.length / 1024).toFixed(0)} KB · ` +
    `${children.length} paragraphs · ${checkedChars} characters verified byte-for-byte`);
});
