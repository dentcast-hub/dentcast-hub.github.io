#!/usr/bin/env python3
# One-off helper to assemble English clinical-insight pages with the exact
# insight/en/insight-2.html chrome/style/schema. Body is hand-translated per article.
import sys
sys.path.insert(0, "tools")
from _in_parts import STYLE, CHROME, TAIL

GA = '''  <!-- Google Analytics (deferred: loads only after the page is fully rendered) -->
  <script>
    window.addEventListener('load', function () {
      window.dataLayer = window.dataLayer || [];
      function gtag(){ dataLayer.push(arguments); }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', 'G-GMM0WC8X3M');
      var ga = document.createElement('script');
      ga.async = true;
      ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-GMM0WC8X3M';
      document.head.appendChild(ga);
    });
  </script>'''

AUTHOR_FOOTER = '''<div class="author-note">
  <a href="/about.html" class="author-link">Dr. Foad Shahabian</a>
  <span class="author-role">Prosthodontist &amp; Implant Specialist</span>
</div>

<footer class="dc-site-footer" style="text-align:center; margin-top:45px; color:#9aa1b3; font-size:.9rem; line-height:1.8;">

  <div style="margin-bottom:22px;">
    <a href="../index.html"
       style="
         display:inline-block;
         background:rgba(11,95,255,0.18);
         color:var(--link);
         border:1.8px solid rgba(var(--link-rgb),0.45);
         border-radius:12px;
         padding:12px 42px;
         font-weight:700;
         text-decoration:none;
         font-size:1rem;
         box-shadow:0 0 14px rgba(11,95,255,0.15);
         transition:all .25s ease;">
      <svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg> Back
    </a>
  </div>

    <div style="margin-top:6px;">
      © 2025 DentCast
    </div>

  </footer>
</main>'''

def build(spec):
    n = spec["n"]
    fa = f"insight-{n}.html"
    title = spec["title_tag"]
    desc = spec["desc"]
    desc_ld = spec.get("desc_ld", desc)
    headline = spec["headline"]
    h1 = spec["h1"]
    img_url = spec["img_url"]
    dpub, dmod, drev = spec["date_pub"], spec["date_mod"], spec["date_rev"]
    prof = spec.get("prof", "Expert")
    body = spec["body"]
    base = f"https://dentcast.org/insight/en/{fa}"

    head = f'''<!DOCTYPE html>
<!-- data-dc-no-header: opt out of the shared (Persian/RTL) header injected by dc-nav.js; this page keeps its own English/LTR header. -->
<html lang="en" dir="ltr" data-dc-no-header>
<head>
{GA}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{desc}">

  <link rel="canonical" href="{base}">
  <link rel="alternate" hreflang="fa-IR" href="https://dentcast.ir/insight/{fa}">
  <link rel="alternate" hreflang="fa" href="https://dentcast.org/insight/{fa}">
  <link rel="alternate" hreflang="en" href="{base}">
  <link rel="alternate" hreflang="x-default" href="https://dentcast.org/insight/{fa}">

{STYLE}

  <!-- 🔵 Schema JSON-LD -->
  <script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@graph": [
    {{
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": @@HEADLINE@@,
      "description": @@DESCLD@@,
      "image": "{img_url}",
      "author": {{
        "@id": "https://dentcast.org/#person-foad"
      }},
      "publisher": {{
        "@id": "https://dentcast.org/#org-dentcast"
      }},
      "mainEntityOfPage": {{
        "@type": "WebPage",
        "@id": "{base}"
      }},
      "url": "{base}",
      "articleSection": "Clinical Insight",
      "inLanguage": "en",
      "datePublished": "{dpub}",
      "dateModified": "{dmod}",
      "proficiencyLevel": "{prof}"
    }},
    {{
      "@type": "WebPage",
      "@id": "{base}#webpage",
      "url": "{base}",
      "isPartOf": {{
        "@id": "https://dentcast.org/#website"
      }},
      "primaryImageOfPage": {{
        "@type": "ImageObject",
        "url": "https://dentcast.org/logo-v2.png"
      }}
    }}
  ]
}}
</script>


  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/favicon.png">
  <link rel="icon" type="image/png" sizes="512x512" href="/favicon.png">
  <link rel="apple-touch-icon" href="/favicon.png">
  <meta name="theme-color" content="#0b5fff">
    <link rel="stylesheet" href="/dc-theme.css">
<link rel="stylesheet" href="/dc-nav.css?v=12">
  <link rel="stylesheet" href="/global-search.css?v=2">
  <script>(function(){{var s=localStorage.getItem('dc-theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s==='dark'||(s===null&&d))document.documentElement.setAttribute('data-theme','dark');}})()</script>
  <meta property="og:type" content="article">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="DentCast">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{base}">
  <meta property="og:image" content="https://dentcast.org/dentcast-cover.webp">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{desc}">
  <meta name="twitter:image" content="https://dentcast.org/dentcast-cover.webp">
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  "@id": "{base}#medicalwebpage",
  "url": "{base}",
  "name": @@HEADLINE@@,
  "description": @@DESCLD@@,
  "datePublished": "{dpub}",
      "dateModified": "{dmod}",
  "inLanguage": "en",
  "isPartOf": {{ "@id": "https://dentcast.org/#website" }},
  "author": {{ "@id": "https://dentcast.org/#person-foad" }},
  "reviewedBy": {{ "@id": "https://dentcast.org/#person-foad" }},
  "lastReviewed": "{drev}",
  "audience": {{
    "@type": "MedicalAudience",
    "audienceType": "Dentist",
    "healthCondition": {{
      "@type": "MedicalCondition",
      "name": "Dental Prosthetics and Implantology"
    }}
  }},
  "specialty": "Dentistry",
  "medicalAudience": "Dentist"
}}
</script>
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {{ "@type": "ListItem", "position": 1, "name": "DentCast", "item": "https://dentcast.org/" }},
    {{ "@type": "ListItem", "position": 2, "name": "Clinical Insight", "item": "https://dentcast.org/insight/" }},
    {{ "@type": "ListItem", "position": 3, "name": @@TITLE@@, "item": "{base}" }}
  ]
}}
</script>
  <meta name="robots" content="index, follow, max-image-preview:large">
</head>

'''
    import json as _j
    head = head.replace("@@HEADLINE@@", _j.dumps(headline, ensure_ascii=False))
    head = head.replace("@@DESCLD@@", _j.dumps(desc_ld, ensure_ascii=False))
    head = head.replace("@@TITLE@@", _j.dumps(title, ensure_ascii=False))

    main = f'''<body>
{CHROME}
<main class="article-content-wrap">
  <h1>{h1}</h1>
  <div class="dc-trustline" aria-label="Author and review information">
    <span>Published: <time datetime="{dpub}">{dpub}</time></span>
    <span>Last reviewed: <time datetime="{drev}">{drev}</time></span>
  </div>


  <div class="glass-box">
    <!-- 🌐 Persian Version (SEO-friendly link) -->
    <a class="lang-btn"
       href="../{fa}"
       rel="noopener">
      <svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20"/><path d="M12 2a15 15 0 0 0 0 20"/></svg> فارسی
    </a>

@@BODY@@

  <p class="dc-disclaimer">The content of this page is intended for the educational use of dentists and dental students.</p>
</div>

{AUTHOR_FOOTER}
{TAIL}'''
    out = head + main
    out = out.replace("@@BODY@@", body)
    path = f"insight/en/{fa}"
    with open(path, "w", encoding="utf-8") as f:
        f.write(out)
    print("wrote", path)

if __name__ == "__main__":
    pass
