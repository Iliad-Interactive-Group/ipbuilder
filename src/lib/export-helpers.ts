
import jsPDF from 'jspdf';
import type { GeneratedCopyItem } from '@/components/page/generated-copy-display';
import type { PodcastOutlineStructure, BlogPostStructure, BillboardAdStructure, DisplayAdVariation, LandingPageStructure, WebsitePageStructure, WireframeSiteStructure, EmailStructure } from '@/ai/flows/generate-marketing-copy';

/**
 * Sanitize text for jsPDF rendering.
 * jsPDF's built-in Helvetica only supports WinAnsi (Latin-1) encoding.
 * This strips emojis and maps common Unicode chars to safe equivalents.
 */
const sanitizeForPdf = (text: string): string => {
    return text
        // Common typographic replacements
        .replace(/[\u2018\u2019\u201A]/g, "'")   // smart single quotes
        .replace(/[\u201C\u201D\u201E]/g, '"')    // smart double quotes
        .replace(/\u2026/g, '...')                 // ellipsis
        .replace(/\u2013/g, '-')                   // en-dash
        .replace(/\u2014/g, '--')                  // em-dash
        .replace(/\u00A0/g, ' ')                   // non-breaking space
        // Strip emoji and other non-Latin-1 characters (keep U+0000–U+00FF + bullet U+2022)
        .replace(/[\u2022]/g, '\u2022')            // preserve bullet (handled by jsPDF)
        .replace(/[^\x00-\xFF\u2022]/g, '')        // strip everything else outside Latin-1
        .replace(/\s{2,}/g, ' ')                   // collapse double spaces from stripped chars
        .trim();
};

const podcastOutlineToString = (outline: PodcastOutlineStructure): string => {
  let content = `Podcast Episode Outline\n\n`;
  content += `Title: ${outline.episodeTitle}\n`;
  content += `Goal: ${outline.episodeGoal}\n`;
  content += `Target Audience: ${outline.targetAudience}\n`;
  content += `Target Length: ${outline.totalLength}\n\n`;
  content += `--- Introduction (${outline.introduction.duration}) ---\n`;
  content += `Hook: ${outline.introduction.hook}\n`;
  content += `Overview: ${outline.introduction.episodeOverview}\n\n`;

  outline.mainContent.forEach((segment, index) => {
    content += `--- Segment ${index + 1}: ${segment.segmentTitle} (${segment.duration}) ---\n`;
    content += `Key Points:\n${segment.keyPoints.map(p => `  - ${p}`).join('\n')}\n`;
    content += `Talking Points:\n${segment.talkingPoints.map(p => `  - ${p}`).join('\n')}\n`;
    if(segment.supportingMaterial) content += `Supporting Material: ${segment.supportingMaterial}\n`;
    content += `\n`;
  });

  content += `--- Conclusion (${outline.conclusion.duration}) ---\n`;
  content += `Recap: ${outline.conclusion.recap}\n`;
  content += `Call to Action: ${outline.conclusion.callToAction}\n`;
  content += `Teaser: ${outline.conclusion.teaser}\n`;

  if (outline.productionNotes) {
    content += `\n--- Production Notes ---\n`;
    if (outline.productionNotes.music) content += `Music: ${outline.productionNotes.music}\n`;
    if (outline.productionNotes.sfx) content += `Sound Effects: ${outline.productionNotes.sfx}\n`;
    if (outline.productionNotes.adSpots) content += `Ad Spots: ${outline.productionNotes.adSpots}\n`;
  }

  return content;
};

const podcastOutlineToHtml = (outline: PodcastOutlineStructure): string => {
    const segmentsHtml = outline.mainContent.map((segment, index) => {
        const keyPointsHtml = segment.keyPoints.map(p => `<li>${escapeHtml(p)}</li>`).join('');
        const talkingPointsHtml = segment.talkingPoints.map(p => `<li>${escapeHtml(p)}</li>`).join('');
        return `
            <div class="podcast-segment">
                <h3 class="podcast-segment-title">Segment ${index + 1}: ${escapeHtml(segment.segmentTitle)} <span class="podcast-duration">${escapeHtml(segment.duration)}</span></h3>
                <div class="podcast-points">
                    <p class="podcast-points-label">Key Points</p>
                    <ul>${keyPointsHtml}</ul>
                </div>
                <div class="podcast-points">
                    <p class="podcast-points-label">Talking Points</p>
                    <ul>${talkingPointsHtml}</ul>
                </div>
                ${segment.supportingMaterial ? `<p class="podcast-supporting"><strong>Supporting Material:</strong> ${escapeHtml(segment.supportingMaterial)}</p>` : ''}
            </div>
        `;
    }).join('');

    let productionHtml = '';
    if (outline.productionNotes) {
        const notes = outline.productionNotes;
        productionHtml = `
            <div class="podcast-production">
                <h3 class="podcast-production-title">Production Notes</h3>
                ${notes.music ? `<p><strong>Music:</strong> ${escapeHtml(notes.music)}</p>` : ''}
                ${notes.sfx ? `<p><strong>Sound Effects:</strong> ${escapeHtml(notes.sfx)}</p>` : ''}
                ${notes.adSpots ? `<p><strong>Ad Spots:</strong> ${escapeHtml(notes.adSpots)}</p>` : ''}
            </div>
        `;
    }

    return `
        <article class="podcast-outline">
            <h2 class="podcast-title">${escapeHtml(outline.episodeTitle)}</h2>
            <div class="podcast-meta">
                <p><strong>Goal:</strong> ${escapeHtml(outline.episodeGoal)}</p>
                <p><strong>Target Audience:</strong> ${escapeHtml(outline.targetAudience)}</p>
                <p><strong>Total Length:</strong> ${escapeHtml(outline.totalLength)}</p>
            </div>
            <div class="podcast-section podcast-intro">
                <h3>Introduction <span class="podcast-duration">${escapeHtml(outline.introduction.duration)}</span></h3>
                <p><strong>Hook:</strong> ${escapeHtml(outline.introduction.hook)}</p>
                <p><strong>Overview:</strong> ${escapeHtml(outline.introduction.episodeOverview)}</p>
            </div>
            ${segmentsHtml}
            <div class="podcast-section podcast-conclusion">
                <h3>Conclusion <span class="podcast-duration">${escapeHtml(outline.conclusion.duration)}</span></h3>
                <p><strong>Recap:</strong> ${escapeHtml(outline.conclusion.recap)}</p>
                <p><strong>Call to Action:</strong> ${escapeHtml(outline.conclusion.callToAction)}</p>
                <p><strong>Next Episode Teaser:</strong> ${escapeHtml(outline.conclusion.teaser)}</p>
            </div>
            ${productionHtml}
        </article>
    `;
};

const blogPostToString = (post: BlogPostStructure): string => {
    if (!post || typeof post !== 'object') {
        console.warn('[Export] Invalid blog post:', post);
        return '[Invalid blog post structure]';
    }

    let content = '';
    
    // Add title
    if (post.title) {
        content += `${post.title}\n\n`;
    }
    
    // Add topic/theme if available
    if (post.topic_theme) {
        content += `Theme: ${post.topic_theme}\n`;
    }
    
    // Add key takeaways if available
    if (post.keyTakeaways && Array.isArray(post.keyTakeaways) && post.keyTakeaways.length > 0) {
        content += `Key Takeaways:\n${post.keyTakeaways.map(t => `  • ${t}`).join('\n')}\n\n`;
    }
    
    // Add sections with content
    if (post.sections && Array.isArray(post.sections)) {
        post.sections.forEach(section => {
            if (section.heading) {
                content += `${section.heading}\n`;
            }
            
            if (section.contentItems && Array.isArray(section.contentItems)) {
                section.contentItems.forEach(item => {
                    if (item.paragraph) {
                        content += `${item.paragraph}\n\n`;
                    } else if (item.listItems && Array.isArray(item.listItems)) {
                        item.listItems.forEach(listItem => {
                            content += `  • ${listItem}\n`;
                        });
                        content += '\n';
                    }
                });
            }
        });
    }
    
    // Add FAQ if available
    if (post.faqSnippet && post.faqSnippet.question) {
        content += `\nFAQ\nQ: ${post.faqSnippet.question}\nA: ${post.faqSnippet.answer}\n`;
    }

    return content;
};

const getFilenameBase = (copies: GeneratedCopyItem[]): string => {
    if (!copies || copies.length === 0) return "marketing";
    const firstContentTypeLabel = copies[0].label || "marketing";
    return `${firstContentTypeLabel.toLowerCase().replace(/\s+/g, '_').substring(0,20)}`;
}

const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const isBlogPostStructure = (value: unknown): value is BlogPostStructure => {
        return typeof value === 'object' && value !== null && 'sections' in value && 'title' in value;
};

const isBlogPostSeries = (value: unknown): value is BlogPostStructure[] => {
        return Array.isArray(value) && value.length > 0 && isBlogPostStructure(value[0]);
};

// --- Billboard Ad type guard + helpers ---
const isBillboardAdStructure = (value: unknown): value is BillboardAdStructure => {
    return typeof value === 'object' && value !== null && 'headline' in value && 'cta' in value && 'overallConcept' in value;
};

const billboardAdToString = (ad: BillboardAdStructure): string => {
    let text = 'BILLBOARD AD CONCEPT\n';
    text += '====================\n\n';
    text += `Headline: ${ad.headline}\n\n`;
    text += `Subheadline: ${ad.subheadline}\n\n`;
    text += `CTA: ${ad.cta}\n\n`;
    text += `Visual Notes: ${ad.visualNotes}\n\n`;
    text += `Overall Concept: ${ad.overallConcept}\n`;
    return text;
};

const billboardAdToHtml = (ad: BillboardAdStructure): string => {
    return `
        <article class="billboard-card">
            <div class="billboard-preview">
                <p class="billboard-kicker">Billboard Concept</p>
                <h2 class="billboard-headline">${escapeHtml(ad.headline)}</h2>
                <p class="billboard-subheadline">${escapeHtml(ad.subheadline)}</p>
                <div class="billboard-cta">${escapeHtml(ad.cta)}</div>
            </div>
            <div class="billboard-details">
                <div class="billboard-detail-block">
                    <p class="billboard-detail-label">Visual Notes</p>
                    <p>${escapeHtml(ad.visualNotes)}</p>
                </div>
                <div class="billboard-detail-block">
                    <p class="billboard-detail-label">Overall Concept</p>
                    <p>${escapeHtml(ad.overallConcept)}</p>
                </div>
            </div>
        </article>
    `;
};

// --- Email type guard + helpers ---
const isEmailStructure = (value: unknown): value is EmailStructure => {
    return typeof value === 'object' && value !== null && 'subjectLine' in value && 'bodyParagraphs' in value;
};

const emailToString = (email: EmailStructure): string => {
    let text = 'EMAIL CAMPAIGN\n';
    text += '==============\n\n';
    text += `Subject Line: ${email.subjectLine}\n`;
    text += `Preheader: ${email.preheaderText}\n\n`;
    text += `${email.greeting}\n\n`;
    email.bodyParagraphs.forEach(p => { text += `${p}\n\n`; });
    text += `[CTA] ${email.cta}`;
    if (email.ctaUrl) text += ` → ${email.ctaUrl}`;
    text += `\n\n`;
    text += `${email.signature}\n\n`;
    text += `---\n${email.complianceNote}\n`;
    if (email.emailType) text += `\nEmail Type: ${email.emailType}\n`;
    return text;
};

const emailToHtml = (email: EmailStructure): string => {
    const bodyHtml = email.bodyParagraphs
        .map(p => `<p class="email-body-paragraph">${escapeHtml(p)}</p>`)
        .join('');

    return `
        <article class="email-card">
            <div class="email-header">
                <p class="email-subject"><strong>Subject:</strong> ${escapeHtml(email.subjectLine)}</p>
                <p class="email-preheader"><strong>Preheader:</strong> ${escapeHtml(email.preheaderText)}</p>
            </div>
            <div class="email-body">
                <p class="email-greeting">${escapeHtml(email.greeting)}</p>
                ${bodyHtml}
                <div class="email-cta-wrapper">
                    <span class="email-cta-btn">${escapeHtml(email.cta)}</span>
                    ${email.ctaUrl ? `<p class="email-cta-url">Links to: ${escapeHtml(email.ctaUrl)}</p>` : ''}
                </div>
            </div>
            <div class="email-footer">
                <p class="email-signature">${escapeHtml(email.signature).replace(/\n/g, '<br>')}</p>
                <p class="email-compliance">${escapeHtml(email.complianceNote)}</p>
            </div>
            ${email.emailType ? `<div class="email-type-badge">${escapeHtml(email.emailType.replace(/_/g, ' '))}</div>` : ''}
        </article>
    `;
};

// --- Display Ad Copy type guard + helpers ---
const isDisplayAdVariations = (value: unknown): value is DisplayAdVariation[] => {
    return Array.isArray(value) && value.length > 0 &&
           typeof value[0] === 'object' && value[0] !== null &&
           'headline' in value[0] && 'body' in value[0] && 'cta' in value[0];
};

const displayAdVariationsToString = (variations: DisplayAdVariation[]): string => {
    return variations.map((v, idx) => {
        let text = `--- Variation ${idx + 1} of ${variations.length} ---\n`;
        text += `Headline: ${v.headline}\n`;
        text += `Body: ${v.body}\n`;
        text += `CTA: ${v.cta}\n`;
        text += `Visual Notes: ${v.visualNotes}\n`;
        return text;
    }).join('\n');
};

const displayAdVariationsToHtml = (variations: DisplayAdVariation[]): string => {
    const cards = variations.map((v, idx) => `
        <article class="display-ad-card">
            <div class="display-ad-label">Variation ${idx + 1} of ${variations.length}</div>
            <h3 class="display-ad-headline">${escapeHtml(v.headline)}</h3>
            <p class="display-ad-body">${escapeHtml(v.body)}</p>
            <div class="display-ad-cta">${escapeHtml(v.cta)}</div>
            <p class="display-ad-visual-notes"><strong>Visual Notes:</strong> ${escapeHtml(v.visualNotes)}</p>
        </article>
    `).join('');
    return `<div class="display-ad-grid">${cards}</div>`;
};

// --- Landing Page type guard + helpers ---
const isLandingPageStructure = (value: unknown): value is LandingPageStructure => {
    return typeof value === 'object' && value !== null && 'heroCtaText' in value && 'headline' in value && 'problemStatement' in value;
};

const landingPageToString = (lp: LandingPageStructure): string => {
    let text = 'LANDING PAGE COPY\n';
    text += '==================\n\n';
    text += `Headline: ${lp.headline}\n`;
    text += `Subheadline: ${lp.subheadline}\n\n`;
    text += `Hero CTA: ${lp.heroCtaText}`;
    if (lp.heroCtaDestination) text += ` → ${lp.heroCtaDestination}`;
    text += `\n\n`;
    text += `--- Problem ---\n${lp.problemStatement}\n\n`;
    text += `--- Solution ---\n${lp.solutionOverview}\n\n`;
    text += `--- Features ---\n`;
    lp.features.forEach((f, idx) => {
        text += `  ${idx + 1}. ${f.title}: ${f.description}\n`;
    });
    text += `\nSocial Proof: ${lp.socialProof}\n`;
    text += `Urgency: ${lp.urgencyElement}\n\n`;
    text += `Final CTA: ${lp.finalCtaText}`;
    if (lp.finalCtaDestination) text += ` → ${lp.finalCtaDestination}`;
    text += `\n\n`;
    text += `Design Notes: ${lp.designNotes}\n`;
    text += `Meta Title: ${lp.metaTitle}\n`;
    text += `Meta Description: ${lp.metaDescription}\n`;
    return text;
};

const landingPageToHtml = (lp: LandingPageStructure): string => {
    const featuresHtml = lp.features.map(f => `
        <div class="lp-feature-card">
            <h4>${escapeHtml(f.title)}</h4>
            <p>${escapeHtml(f.description)}</p>
        </div>
    `).join('');

    return `
        <div class="lp-hero">
            <h2 class="lp-headline">${escapeHtml(lp.headline)}</h2>
            <p class="lp-subheadline">${escapeHtml(lp.subheadline)}</p>
            <div class="lp-cta-btn">${escapeHtml(lp.heroCtaText)}</div>
            ${lp.heroCtaDestination ? `<p class="lp-cta-dest">Links to: ${escapeHtml(lp.heroCtaDestination)}</p>` : ''}
        </div>
        <div class="lp-problem-solution">
            <div class="lp-problem">
                <p class="lp-section-label">Problem</p>
                <p>${escapeHtml(lp.problemStatement)}</p>
            </div>
            <div class="lp-solution">
                <p class="lp-section-label">Solution</p>
                <p>${escapeHtml(lp.solutionOverview)}</p>
            </div>
        </div>
        <div class="lp-features">
            <p class="lp-section-label">Key Features &amp; Benefits</p>
            <div class="lp-features-grid">${featuresHtml}</div>
        </div>
        <div class="lp-social-proof">
            <p class="lp-section-label">Social Proof</p>
            <p class="lp-social-proof-text">${escapeHtml(lp.socialProof)}</p>
        </div>
        <div class="lp-urgency">
            <p>${escapeHtml(lp.urgencyElement)}</p>
        </div>
        <div class="lp-final-cta">
            <div class="lp-cta-btn">${escapeHtml(lp.finalCtaText)}</div>
            ${lp.finalCtaDestination ? `<p class="lp-cta-dest">Links to: ${escapeHtml(lp.finalCtaDestination)}</p>` : ''}
        </div>
        <div class="lp-meta">
            <p><strong>Design Notes:</strong> ${escapeHtml(lp.designNotes)}</p>
            <p><strong>Meta Title:</strong> ${escapeHtml(lp.metaTitle)}</p>
            <p><strong>Meta Description:</strong> ${escapeHtml(lp.metaDescription)}</p>
        </div>
    `;
};

// --- Standard Website type guard + helpers ---
const isStandardWebsitePages = (value: unknown): value is WebsitePageStructure[] => {
    return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null && 'pageName' in value[0] && 'sections' in value[0];
};

const standardWebsiteToString = (pages: WebsitePageStructure[]): string => {
    return pages.map((page, idx) => {
        let text = `${'='.repeat(50)}\n`;
        text += `PAGE ${idx + 1}: ${page.pageName} (${page.pageSlug})\n`;
        text += `${'='.repeat(50)}\n`;
        text += `Meta Title: ${page.metaTitle}\n`;
        text += `Meta Description: ${page.metaDescription}\n\n`;
        page.sections.forEach((section, sIdx) => {
            text += `--- ${section.sectionType.toUpperCase()}: ${section.heading} ---\n`;
            if (section.subheading) text += `Subheading: ${section.subheading}\n`;
            text += `${section.bodyContent}\n`;
            if (section.ctaText) text += `CTA: ${section.ctaText}`;
            if (section.ctaDestination) text += ` → ${section.ctaDestination}`;
            if (section.ctaText) text += `\n`;
            if (section.designNotes) text += `Design: ${section.designNotes}\n`;
            text += '\n';
        });
        return text;
    }).join('\n');
};

const standardWebsitePageToHtml = (page: WebsitePageStructure): string => {
    const sectionsHtml = page.sections.map(s => `
        <div class="ws-section">
            <div class="ws-section-type">${escapeHtml(s.sectionType)}</div>
            <h3 class="ws-section-heading">${escapeHtml(s.heading)}</h3>
            ${s.subheading ? `<p class="ws-section-subheading">${escapeHtml(s.subheading)}</p>` : ''}
            <div class="ws-section-body">${escapeHtml(s.bodyContent).replace(/\n/g, '<br>')}</div>
            ${s.ctaText ? `<div class="ws-section-cta">${escapeHtml(s.ctaText)}${s.ctaDestination ? ` <span class="ws-cta-dest">→ ${escapeHtml(s.ctaDestination)}</span>` : ''}</div>` : ''}
            ${s.designNotes ? `<p class="ws-design-note">${escapeHtml(s.designNotes)}</p>` : ''}
        </div>
    `).join('');

    return `
        <article class="ws-page">
            <div class="ws-page-header">
                <h2 class="ws-page-name">${escapeHtml(page.pageName)}</h2>
                <span class="ws-page-slug">${escapeHtml(page.pageSlug)}</span>
            </div>
            <div class="ws-page-meta">
                <p><strong>Meta Title:</strong> ${escapeHtml(page.metaTitle)}</p>
                <p><strong>Meta Desc:</strong> ${escapeHtml(page.metaDescription)}</p>
            </div>
            ${sectionsHtml}
        </article>
    `;
};

// --- Website Wireframe type guard + helpers ---
const isWireframeSiteStructure = (value: unknown): value is WireframeSiteStructure => {
    return typeof value === 'object' && value !== null && 'siteNavigation' in value && 'pages' in value && 'footer' in value;
};

const wireframeSiteToString = (wf: WireframeSiteStructure): string => {
    let text = 'WEBSITE WIREFRAME\n';
    text += '==================\n\n';
    text += `Navigation: ${wf.siteNavigation.menuItems.join(' | ')}`;
    if (wf.siteNavigation.ctaButton) text += ` | [${wf.siteNavigation.ctaButton}]`;
    text += `\nLogo: ${wf.siteNavigation.logoPosition}\n\n`;
    
    wf.pages.forEach((page, idx) => {
        text += `${'='.repeat(50)}\n`;
        text += `PAGE ${idx + 1}: ${page.pageName} (${page.pageSlug})\n`;
        text += `${'='.repeat(50)}\n`;
        page.sections.forEach(section => {
            text += `\n  [${section.sectionName}] — ${section.layoutType}\n`;
            text += `  Content: ${section.contentPlaceholder}\n`;
            if (section.functionalNotes) text += `  Functional: ${section.functionalNotes}\n`;
            if (section.designSpecs) text += `  Design: ${section.designSpecs}\n`;
        });
        text += '\n';
    });

    text += `\nFOOTER:\n`;
    wf.footer.columns.forEach(col => {
        text += `  ${col.heading}: ${col.items.join(', ')}\n`;
    });
    text += `  ${wf.footer.copyright}\n\n`;

    text += `DESIGN SYSTEM:\n`;
    text += `  Colors: ${wf.designSystem.colorScheme}\n`;
    text += `  Typography: ${wf.designSystem.typography}\n`;
    text += `  Spacing: ${wf.designSystem.spacing}\n\n`;
    text += `USER FLOW NOTES:\n${wf.userFlowNotes}\n`;
    return text;
};

const wireframeSiteToHtml = (wf: WireframeSiteStructure): string => {
    const navHtml = `
        <div class="wf-nav">
            <span class="wf-logo">[LOGO] ${escapeHtml(wf.siteNavigation.logoPosition)}</span>
            <div class="wf-nav-items">
                ${wf.siteNavigation.menuItems.map(i => `<span class="wf-nav-item">${escapeHtml(i)}</span>`).join('')}
                ${wf.siteNavigation.ctaButton ? `<span class="wf-nav-cta">${escapeHtml(wf.siteNavigation.ctaButton)}</span>` : ''}
            </div>
        </div>
    `;

    const pagesHtml = wf.pages.map(page => {
        const sectionsHtml = page.sections.map(s => `
            <div class="wf-section">
                <div class="wf-section-header">
                    <span class="wf-section-name">${escapeHtml(s.sectionName)}</span>
                    <span class="wf-layout-type">${escapeHtml(s.layoutType)}</span>
                </div>
                <p class="wf-placeholder">${escapeHtml(s.contentPlaceholder)}</p>
                ${s.functionalNotes ? `<p class="wf-functional">⚙ ${escapeHtml(s.functionalNotes)}</p>` : ''}
                ${s.designSpecs ? `<p class="wf-design-spec">🎨 ${escapeHtml(s.designSpecs)}</p>` : ''}
            </div>
        `).join('');
        return `
            <div class="wf-page">
                <h3 class="wf-page-title">${escapeHtml(page.pageName)} <span class="wf-page-slug">${escapeHtml(page.pageSlug)}</span></h3>
                ${sectionsHtml}
            </div>
        `;
    }).join('');

    const footerHtml = `
        <div class="wf-footer">
            <p class="wf-section-label">Footer</p>
            <div class="wf-footer-grid">
                ${wf.footer.columns.map(col => `
                    <div class="wf-footer-col">
                        <p class="wf-footer-heading">${escapeHtml(col.heading)}</p>
                        ${col.items.map(i => `<p class="wf-footer-item">${escapeHtml(i)}</p>`).join('')}
                    </div>
                `).join('')}
            </div>
            <p class="wf-copyright">${escapeHtml(wf.footer.copyright)}</p>
        </div>
    `;

    const designHtml = `
        <div class="wf-design-system">
            <div class="wf-design-block">
                <p class="wf-section-label">Design System</p>
                <p><strong>Colors:</strong> ${escapeHtml(wf.designSystem.colorScheme)}</p>
                <p><strong>Typography:</strong> ${escapeHtml(wf.designSystem.typography)}</p>
                <p><strong>Spacing:</strong> ${escapeHtml(wf.designSystem.spacing)}</p>
            </div>
            <div class="wf-design-block">
                <p class="wf-section-label">User Flow Notes</p>
                <p>${escapeHtml(wf.userFlowNotes)}</p>
            </div>
        </div>
    `;

    return `${navHtml}${pagesHtml}${footerHtml}${designHtml}`;
};

const blogPostToHtml = (post: BlogPostStructure, partLabel?: string): string => {
        const keywordsHtml = post.seoKeywords && post.seoKeywords.length > 0
                ? `<div class="chip-row">${post.seoKeywords.map(kw => `<span class="chip">${escapeHtml(kw)}</span>`).join('')}</div>`
                : '';

        const takeawaysHtml = post.keyTakeaways && post.keyTakeaways.length > 0
                ? `
                        <section class="takeaways">
                            <h4>Key Takeaways</h4>
                            <ul>
                                ${post.keyTakeaways.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                            </ul>
                        </section>
                    `
                : '';

        const sectionsHtml = (post.sections || []).map(section => `
            <section class="blog-section">
                <h3>${escapeHtml(section.heading)}</h3>
                ${(section.contentItems || []).map(item => {
                        if (item.paragraph) {
                                return `<p>${escapeHtml(item.paragraph)}</p>`;
                        }
                        if (item.listItems && item.listItems.length > 0) {
                                return `<ul>${item.listItems.map(li => `<li>${escapeHtml(li)}</li>`).join('')}</ul>`;
                        }
                        return '';
                }).join('')}
            </section>
        `).join('');

        const faqHtml = post.faqSnippet
                ? `
                    <section class="faq">
                        <h4>People Also Ask</h4>
                        <p class="faq-q">Q: ${escapeHtml(post.faqSnippet.question)}</p>
                        <p class="faq-a">A: ${escapeHtml(post.faqSnippet.answer)}</p>
                    </section>
                `
                : '';

        return `
            <article class="blog-article">
                ${partLabel ? `<div class="part-label">${escapeHtml(partLabel)}</div>` : ''}
                ${post.topic_theme ? `<p class="topic-theme">${escapeHtml(post.topic_theme)}</p>` : ''}
                <h2>${escapeHtml(post.title)}</h2>
                ${post.metaDescription ? `<p class="meta-description">${escapeHtml(post.metaDescription)}</p>` : ''}
                ${keywordsHtml}
                ${takeawaysHtml}
                ${sectionsHtml}
                ${faqHtml}
            </article>
        `;
};

/**
 * Get the individual social media posts as a string array.
 * Prefers the original marketingCopy array (which has the correct post boundaries).
 * Only falls back to splitting editedCopy if the user has actually edited the text.
 */
const getSocialMediaPosts = (item: GeneratedCopyItem, editedCopy: Record<string, string>, editedPosts?: Record<string, Record<number, string>>): string[] => {
    // If the original data is an array, always use it — it has perfect post boundaries
    if (Array.isArray(item.marketingCopy)) {
        const postEdits = editedPosts?.[item.value];
        return item.marketingCopy.map((p, idx) => {
            // Prefer per-post edits over original
            if (postEdits && postEdits[idx] !== undefined) return postEdits[idx];
            return typeof p === 'string' ? p : String(p);
        });
    }
    // Fallback: user may have edited or data arrived as single string
    const editedText = editedCopy[item.value];
    if (editedText !== undefined) {
        return [editedText];
    }
    return [String(item.marketingCopy)];
};

/**
 * Build structured HTML for social media posts with per-post cards and embedded images.
 */
const socialMediaPostsToHtml = (item: GeneratedCopyItem, editedCopy: Record<string, string>, editedPosts?: Record<string, Record<number, string>>): string => {
    const posts = getSocialMediaPosts(item, editedCopy, editedPosts);

    let html = '';

    // Image suggestion(s) header
    if (item.imageSuggestions && item.imageSuggestions.length > 0) {
        html += `<div class="sm-images-header"><strong>Image Prompts for A/B Testing</strong></div>`;
        item.imageSuggestions.forEach((suggestion, idx) => {
            html += `<p class="suggestion"><strong>Variant ${idx + 1}:</strong> ${escapeHtml(suggestion)}</p>`;
        });
    } else if (item.imageSuggestion) {
        html += `<p class="suggestion"><strong>Image Suggestion:</strong> ${escapeHtml(item.imageSuggestion)}</p>`;
    }

    // Embedded generated images
    if (item.generatedImages && item.generatedImages.length > 0) {
        html += `<div class="sm-images-grid">`;
        item.generatedImages.forEach((dataUri, idx) => {
            html += `
                <figure class="sm-image-figure">
                    <img src="${dataUri}" alt="Image Variant ${idx + 1}" />
                    <figcaption>Image Variant ${idx + 1}</figcaption>
                </figure>
            `;
        });
        html += `</div>`;
    } else if (item.generatedImage) {
        html += `
            <figure class="sm-image-figure sm-image-single">
                <img src="${item.generatedImage}" alt="Generated Image" />
                <figcaption>Generated Image</figcaption>
            </figure>
        `;
    }

    // Individual post cards
    posts.forEach((post, idx) => {
        html += `
            <article class="sm-post-card">
                <div class="sm-post-label">Post ${idx + 1} of ${posts.length}</div>
                <div class="sm-post-body">${escapeHtml(post).replace(/\n/g, '<br>')}</div>
            </article>
        `;
    });

    return html;
};

const getItemText = (item: GeneratedCopyItem, editedCopy: Record<string, string>, editedVariants?: Record<string, Record<number, string>>): string => {
    const editedText = editedCopy[item.value];
    if (editedText !== undefined) {
        return editedText;
    }
    
    // Handle emails
    if (item.value === 'lead generation email' && isEmailStructure(item.marketingCopy)) {
        return emailToString(item.marketingCopy);
    }
    
    // Handle podcast outlines
    if (item.value === 'podcast outline' && typeof item.marketingCopy === 'object' && !Array.isArray(item.marketingCopy) && 'episodeTitle' in item.marketingCopy) {
       return podcastOutlineToString(item.marketingCopy as PodcastOutlineStructure);
    }

    // Handle website copy — landing page
    if (item.value === 'website copy' && isLandingPageStructure(item.marketingCopy)) {
        return landingPageToString(item.marketingCopy);
    }

    // Handle website copy — standard 5-page
    if (item.value === 'website copy' && isStandardWebsitePages(item.marketingCopy)) {
        return standardWebsiteToString(item.marketingCopy);
    }

    // Handle website wireframe
    if (item.value === 'website wireframe' && isWireframeSiteStructure(item.marketingCopy)) {
        return wireframeSiteToString(item.marketingCopy);
    }
    
    // Handle blog posts
    if (item.value === 'blog post') {
        // Check if it's an array of blog post objects (blog series)
        if (Array.isArray(item.marketingCopy) && item.marketingCopy.length > 0) {
            return item.marketingCopy.map((post, index) => {
                // Each post in the array should have a 'sections' property
                if (typeof post === 'object' && post !== null && 'sections' in post) {
                    return `[Part ${index + 1}] ${blogPostToString(post as BlogPostStructure)}`;
                } else if (typeof post === 'string') {
                    // Fallback for string items
                    return `[Part ${index + 1}] ${post}`;
                } else {
                    console.warn('[Export] Invalid blog post object:', post);
                    return `[Part ${index + 1}] [Invalid blog post structure]`;
                }
            }).join('\n\n' + '='.repeat(60) + '\n\n');
        } 
        // Single blog post object
        else if (typeof item.marketingCopy === 'object' && item.marketingCopy !== null && 'sections' in item.marketingCopy) {
            return blogPostToString(item.marketingCopy as BlogPostStructure);
        }
        // If we get here and it's still a blog post, log a warning
        console.warn('[Export] Unexpected blog post structure:', item.marketingCopy);
        return `[Unable to export blog post - unexpected structure]`;
    }
    
    // Fallback for other array types (like social media posts which are strings) or simple strings
    if (Array.isArray(item.marketingCopy)) {
        return item.marketingCopy.map(item => typeof item === 'string' ? item : String(item)).join('\n\n');
    }
    
    return String(item.marketingCopy);
};


export const exportTextFile = (copies: GeneratedCopyItem[], editedCopy: Record<string, string>, editedVariants?: Record<string, Record<number, string>>, editedPosts?: Record<string, Record<number, string>>) => {
  let textContent = "";
  copies.forEach(copy => {
    textContent += `Content Type: ${copy.label}\n`;
    // imageSuggestions (plural) + singular fallback
    if (copy.imageSuggestions && copy.imageSuggestions.length > 0) {
      copy.imageSuggestions.forEach((s: string, idx: number) => {
        textContent += `Image Variant ${idx + 1}: ${s}\n`;
      });
    } else if (copy.imageSuggestion) {
      textContent += `Image Suggestion: ${copy.imageSuggestion}\n`;
    }
    textContent += `------------------------------------------\n`;

    // Social media: numbered posts
    if (copy.value === 'social media post') {
        const smPosts = getSocialMediaPosts(copy, editedCopy, editedPosts);
        smPosts.forEach((post: string, idx: number) => {
            textContent += `\n--- Post ${idx + 1} of ${smPosts.length} ---\n`;
            textContent += `${post}\n`;
        });
        textContent += `\n\n`;
    } else if (copy.value === 'lead generation email' && isEmailStructure(copy.marketingCopy)) {
        textContent += `${emailToString(copy.marketingCopy)}\n\n`;
    } else if (copy.value === 'billboard' && isBillboardAdStructure(copy.marketingCopy)) {
        textContent += `${billboardAdToString(copy.marketingCopy)}\n\n`;
    } else if (copy.value === 'display ad copy' && isDisplayAdVariations(copy.marketingCopy)) {
        textContent += `${displayAdVariationsToString(copy.marketingCopy)}\n\n`;
    } else if (copy.value === 'website copy' && isLandingPageStructure(copy.marketingCopy)) {
        textContent += `${landingPageToString(copy.marketingCopy)}\n\n`;
    } else if (copy.value === 'website copy' && isStandardWebsitePages(copy.marketingCopy)) {
        textContent += `${standardWebsiteToString(copy.marketingCopy)}\n\n`;
    } else if (copy.value === 'website wireframe' && isWireframeSiteStructure(copy.marketingCopy)) {
        textContent += `${wireframeSiteToString(copy.marketingCopy)}\n\n`;
    } else {
        const itemText = getItemText(copy, editedCopy, editedVariants);
        textContent += `${itemText}\n\n\n`;
    }
  });

  const element = document.createElement("a");
  const file = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = `${getFilenameBase(copies)}_marketing_copies.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
};

/**
 * Renders a single BlogPostStructure into the jsPDF document with proper formatting.
 * Returns the updated yPosition after rendering.
 */
const renderBlogPostToPdf = (
    doc: jsPDF,
    post: BlogPostStructure,
    startY: number,
    margin: number,
    maxLineWidth: number,
    pageHeight: number,
    lineHeightFactor: number
): number => {
    let yPosition = startY;
    const bodyLineHeight = 5.4;
    const compactLineHeight = 4.6;
    const titleLineHeight = 7.2;
    const headingLineHeight = 6;

    const ensureSpace = (neededHeight: number) => {
        if (yPosition + neededHeight > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
        }
    };

    doc.setDrawColor(230, 230, 230);
    doc.line(margin, yPosition, margin + maxLineWidth, yPosition);
    yPosition += 4;

    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(18, 18, 18);
    const titleLines = doc.splitTextToSize(post.title || 'Untitled Post', maxLineWidth);
    ensureSpace(titleLines.length * titleLineHeight + 3);
    doc.text(titleLines, margin, yPosition);
    yPosition += (titleLines.length * titleLineHeight) + 3;

    if (post.topic_theme) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(90, 90, 90);
        const themeLine = `Theme: ${post.topic_theme}`;
        ensureSpace(compactLineHeight + 2);
        doc.text(themeLine, margin, yPosition);
        yPosition += compactLineHeight + 2;
    }

    if (post.metaDescription) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(75, 75, 75);
        const metaLines = doc.splitTextToSize(`Meta: ${post.metaDescription}`, maxLineWidth);
        ensureSpace(metaLines.length * compactLineHeight + 2);
        doc.text(metaLines, margin, yPosition);
        yPosition += (metaLines.length * compactLineHeight) + 2;
    }

    if (post.seoKeywords && post.seoKeywords.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 55, 55);
        const kwText = `Keywords: ${post.seoKeywords.join(', ')}`;
        const kwLines = doc.splitTextToSize(kwText, maxLineWidth);
        ensureSpace(kwLines.length * compactLineHeight + 3);
        doc.text(kwLines, margin, yPosition);
        yPosition += (kwLines.length * compactLineHeight) + 4;
    }

    if (post.keyTakeaways && post.keyTakeaways.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 22, 22);
        ensureSpace(headingLineHeight + 2);
        doc.text('Key Takeaways', margin, yPosition);
        yPosition += headingLineHeight;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(35, 35, 35);
        post.keyTakeaways.forEach(takeaway => {
            const bulletLines = doc.splitTextToSize(`  \u2022 ${takeaway}`, maxLineWidth - 4);
            ensureSpace(bulletLines.length * bodyLineHeight);
            doc.text(bulletLines, margin, yPosition);
            yPosition += bulletLines.length * bodyLineHeight;
        });
        yPosition += 3;
    }

    if (post.sections && Array.isArray(post.sections)) {
        post.sections.forEach(section => {
            if (section.heading) {
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(20, 20, 20);
                const headingLines = doc.splitTextToSize(section.heading, maxLineWidth);
                ensureSpace(headingLines.length * headingLineHeight + 3);
                doc.text(headingLines, margin, yPosition);
                yPosition += (headingLines.length * headingLineHeight) + 2;
            }

            if (section.contentItems && Array.isArray(section.contentItems)) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 30, 30);

                section.contentItems.forEach(item => {
                    if (item.paragraph) {
                        const paraLines = doc.splitTextToSize(item.paragraph, maxLineWidth);
                        paraLines.forEach((line: string) => {
                            ensureSpace(bodyLineHeight);
                            doc.text(line, margin, yPosition);
                            yPosition += bodyLineHeight;
                        });
                        yPosition += 2;
                    } else if (item.listItems && Array.isArray(item.listItems) && item.listItems.length > 0) {
                        item.listItems.forEach(listItem => {
                            const bulletLines = doc.splitTextToSize(`  \u2022 ${listItem}`, maxLineWidth - 4);
                            bulletLines.forEach((line: string) => {
                                ensureSpace(bodyLineHeight);
                                doc.text(line, margin, yPosition);
                                yPosition += bodyLineHeight;
                            });
                        });
                        yPosition += 2;
                    }
                });
            }
            yPosition += 2;
        });
    }

    if (post.faqSnippet && post.faqSnippet.question) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 22, 22);
        ensureSpace(headingLineHeight + 2);
        doc.text('People Also Ask', margin, yPosition);
        yPosition += headingLineHeight;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(28, 28, 28);
        const qLines = doc.splitTextToSize(`Q: ${post.faqSnippet.question}`, maxLineWidth);
        ensureSpace(qLines.length * bodyLineHeight + 1);
        doc.text(qLines, margin, yPosition);
        yPosition += qLines.length * bodyLineHeight + 1;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(35, 35, 35);
        const aLines = doc.splitTextToSize(`A: ${post.faqSnippet.answer}`, maxLineWidth);
        ensureSpace(aLines.length * bodyLineHeight + 2);
        doc.text(aLines, margin, yPosition);
        yPosition += aLines.length * bodyLineHeight + 2;
    }

    doc.setTextColor(0, 0, 0);
    yPosition += 3;

    return yPosition;
};

const renderPdfReportHeader = (
        doc: jsPDF,
        reportTitle: string,
        startY: number,
        margin: number,
        maxLineWidth: number
): number => {
        let yPosition = startY;
        const generatedOn = new Date().toLocaleDateString();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(92, 104, 123);
        doc.text('Marketing Report', margin, yPosition);
        yPosition += 6;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(18, 18, 18);
        const titleLines = doc.splitTextToSize(reportTitle, maxLineWidth);
        doc.text(titleLines, margin, yPosition);
        yPosition += titleLines.length * 7.2;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(96, 96, 96);
        doc.text(`Generated: ${generatedOn}`, margin, yPosition);
        yPosition += 4;

        doc.setDrawColor(224, 228, 235);
        doc.line(margin, yPosition, margin + maxLineWidth, yPosition);
        yPosition += 5;

        doc.setTextColor(0, 0, 0);
        return yPosition;
};

export const exportPdf = (copies: GeneratedCopyItem[], editedCopy: Record<string, string>, editedVariants?: Record<string, Record<number, string>>, editedPosts?: Record<string, Record<number, string>>) => {
    try {
      const doc = new jsPDF();
            let yPosition = 15;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      const maxLineWidth = pageWidth - margin * 2;
            const bodyLineHeight = 5.2;

            copies.forEach((copy, copyIndex) => {
                if (copyIndex > 0) {
                    doc.addPage();
                }
                yPosition = margin;
                yPosition = renderPdfReportHeader(doc, copy.label, yPosition, margin, maxLineWidth);

        const ensureSpace = (neededHeight: number) => {
          if (yPosition + neededHeight > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
        };

        // --- Image suggestion text (singular + plural) ---
        if (copy.imageSuggestions && copy.imageSuggestions.length > 0) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(85, 85, 85);
            const slh = 4.8;
            copy.imageSuggestions.forEach((suggestion: string, idx: number) => {
                const sText = sanitizeForPdf(`Image Variant ${idx + 1}: ${suggestion}`);
                const sLines = doc.splitTextToSize(sText, maxLineWidth);
                ensureSpace(sLines.length * slh + 2);
                doc.text(sLines, margin, yPosition);
                yPosition += (sLines.length * slh) + 2;
            });
            yPosition += 2;
        } else if (copy.imageSuggestion) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(85, 85, 85);
            const slh = 4.8;
            const sText = sanitizeForPdf(`Image Suggestion: ${copy.imageSuggestion}`);
            const sLines = doc.splitTextToSize(sText, maxLineWidth);
            ensureSpace(sLines.length * slh + 4);
            doc.text(sLines, margin, yPosition);
            yPosition += (sLines.length * slh) + 3;
        }

        // --- Embed generated images ---
        const addImageToPdf = (dataUri: string, caption: string) => {
            try {
                const imgW = maxLineWidth * 0.65;
                // Determine actual aspect ratio from the data URI
                let imgH = imgW * 0.75; // default 4:3 fallback
                try {
                    const img = new Image();
                    img.src = dataUri;
                    if (img.naturalWidth && img.naturalHeight) {
                        imgH = imgW * (img.naturalHeight / img.naturalWidth);
                    }
                } catch { /* use default ratio */ }
                if (yPosition + imgH + 12 > pageHeight - margin) {
                    doc.addPage();
                    yPosition = margin;
                }
                const imgX = margin + (maxLineWidth - imgW) / 2;
                doc.addImage(dataUri, 'PNG', imgX, yPosition, imgW, imgH);
                yPosition += imgH + 2;
                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(100, 100, 100);
                const cw = doc.getTextWidth(caption);
                doc.text(caption, margin + (maxLineWidth - cw) / 2, yPosition);
                yPosition += 6;
                doc.setTextColor(0, 0, 0);
            } catch (imgErr) {
                console.warn('[PDF Export] Could not embed image:', imgErr);
            }
        };

        if (copy.generatedImages && copy.generatedImages.length > 0) {
            copy.generatedImages.forEach((dataUri: string, idx: number) => {
                addImageToPdf(dataUri, `Image Variant ${idx + 1}`);
            });
        } else if (copy.generatedImage) {
            addImageToPdf(copy.generatedImage, 'Generated Image');
        }

        // --- Content body ---
        const isBlogSeries = copy.value === 'blog post' &&
            Array.isArray(copy.marketingCopy) &&
            copy.marketingCopy.length > 0 &&
            typeof copy.marketingCopy[0] === 'object' &&
            copy.marketingCopy[0] !== null &&
            'title' in (copy.marketingCopy[0] as object);
        const isSingleBlog = copy.value === 'blog post' &&
            !Array.isArray(copy.marketingCopy) &&
            typeof copy.marketingCopy === 'object' &&
            copy.marketingCopy !== null &&
            'sections' in (copy.marketingCopy as object);
        const isSocialMedia = copy.value === 'social media post';

        if (isBlogSeries) {
            const posts = copy.marketingCopy as BlogPostStructure[];
            posts.forEach((post, idx) => {
                if (idx > 0) {
                    doc.addPage();
                    yPosition = margin;
                    yPosition = renderPdfReportHeader(
                        doc,
                        `${copy.label} -- Part ${idx + 1} of ${posts.length}`,
                        yPosition,
                        margin,
                        maxLineWidth
                    );
                }

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(48, 57, 72);
                ensureSpace(10);
                const partLabel = `Part ${idx + 1} of ${posts.length}`;
                doc.text(partLabel, margin, yPosition);
                doc.setTextColor(0, 0, 0);
                yPosition += 8;

                yPosition = renderBlogPostToPdf(doc, post, yPosition, margin, maxLineWidth, pageHeight, 1.15);
                yPosition += 8;
            });
        } else if (isSingleBlog) {
            yPosition = renderBlogPostToPdf(doc, copy.marketingCopy as BlogPostStructure, yPosition, margin, maxLineWidth, pageHeight, 1.15);
        } else if (isSocialMedia) {
            // Structured social media rendering with numbered posts
            // Each post is kept together on a single page (no mid-post breaks)
            const smPosts = getSocialMediaPosts(copy, editedCopy, editedPosts);
            smPosts.forEach((post: string, idx: number) => {
                // Pre-calculate total height of this post
                const sanitized = sanitizeForPdf(post);
                const postLines = doc.splitTextToSize(sanitized, maxLineWidth);
                const postHeight = 
                    14 +                                    // header
                    5.5 + 4 +                               // separator
                    (postLines.length * bodyLineHeight) +   // body
                    6;                                      // trailing space

                // If the whole post won't fit, start a new page
                if (yPosition + postHeight > pageHeight - margin) {
                    doc.addPage();
                    yPosition = margin;
                }

                // Post header
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 30, 30);
                doc.text(`Post ${idx + 1} of ${smPosts.length}`, margin, yPosition);
                yPosition += 5.5;

                // Separator line
                doc.setDrawColor(210, 215, 225);
                doc.line(margin, yPosition, margin + maxLineWidth, yPosition);
                yPosition += 4;

                // Post body
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(28, 28, 28);
                postLines.forEach((line: string) => {
                    doc.text(line, margin, yPosition);
                    yPosition += bodyLineHeight;
                });

                yPosition += 6;
            });
        } else if (copy.value === 'lead generation email' && isEmailStructure(copy.marketingCopy)) {
            // Structured email rendering
            const email = copy.marketingCopy;
            const fieldLH = 5.2;

            // Subject line
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 100, 100);
            ensureSpace(fieldLH + 2);
            doc.text('SUBJECT LINE', margin, yPosition);
            yPosition += fieldLH;
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(18, 18, 18);
            const subjLines = doc.splitTextToSize(sanitizeForPdf(email.subjectLine), maxLineWidth);
            ensureSpace(subjLines.length * 6 + 3);
            doc.text(subjLines, margin, yPosition);
            yPosition += (subjLines.length * 6) + 3;

            // Preheader
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            const preLines = doc.splitTextToSize(sanitizeForPdf('Preheader: ' + email.preheaderText), maxLineWidth);
            ensureSpace(preLines.length * fieldLH + 4);
            doc.text(preLines, margin, yPosition);
            yPosition += (preLines.length * fieldLH) + 4;

            // Separator
            doc.setDrawColor(210, 215, 225);
            doc.line(margin, yPosition, margin + maxLineWidth, yPosition);
            yPosition += 5;

            // Greeting
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 30);
            ensureSpace(fieldLH + 3);
            doc.text(sanitizeForPdf(email.greeting), margin, yPosition);
            yPosition += fieldLH + 3;

            // Body paragraphs
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 30);
            email.bodyParagraphs.forEach((para: string) => {
                const pLines = doc.splitTextToSize(sanitizeForPdf(para), maxLineWidth);
                pLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
                yPosition += 3;
            });

            // CTA
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(79, 70, 229);
            ensureSpace(fieldLH + 4);
            doc.text(sanitizeForPdf('[CTA] ' + email.cta), margin, yPosition);
            yPosition += fieldLH;
            if (email.ctaUrl) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 100, 100);
                doc.text(sanitizeForPdf(email.ctaUrl), margin, yPosition);
                yPosition += fieldLH;
            }
            yPosition += 4;

            // Signature
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            const sigLines = doc.splitTextToSize(sanitizeForPdf(email.signature), maxLineWidth);
            sigLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
            yPosition += 4;

            // Compliance
            doc.setDrawColor(230, 230, 230);
            doc.line(margin, yPosition, margin + maxLineWidth, yPosition);
            yPosition += 3;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(130, 130, 130);
            const compLines = doc.splitTextToSize(sanitizeForPdf(email.complianceNote), maxLineWidth);
            compLines.forEach((line: string) => { ensureSpace(4.5); doc.text(line, margin, yPosition); yPosition += 4.5; });
            yPosition += 3;

            // Email type badge
            if (email.emailType) {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(79, 70, 229);
                ensureSpace(fieldLH);
                doc.text(sanitizeForPdf('Type: ' + email.emailType.replace(/_/g, ' ').toUpperCase()), margin, yPosition);
                yPosition += fieldLH;
            }

        } else if (copy.value === 'podcast outline' && typeof copy.marketingCopy === 'object' && !Array.isArray(copy.marketingCopy) && 'episodeTitle' in copy.marketingCopy) {
            // Structured podcast outline rendering
            const outline = copy.marketingCopy as PodcastOutlineStructure;
            const fieldLH = 5.2;

            // Episode title
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(18, 18, 18);
            const titleLines = doc.splitTextToSize(sanitizeForPdf(outline.episodeTitle), maxLineWidth);
            ensureSpace(titleLines.length * 7 + 3);
            doc.text(titleLines, margin, yPosition);
            yPosition += (titleLines.length * 7) + 3;

            // Meta info
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            ensureSpace(fieldLH * 3 + 4);
            doc.text(sanitizeForPdf(`Goal: ${outline.episodeGoal}`), margin, yPosition); yPosition += fieldLH;
            doc.text(sanitizeForPdf(`Target Audience: ${outline.targetAudience}`), margin, yPosition); yPosition += fieldLH;
            doc.text(sanitizeForPdf(`Total Length: ${outline.totalLength}`), margin, yPosition); yPosition += fieldLH + 4;

            // Introduction
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            ensureSpace(6 + 3);
            doc.text(sanitizeForPdf(`Introduction (${outline.introduction.duration})`), margin, yPosition);
            yPosition += 6;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            const hookLines = doc.splitTextToSize(sanitizeForPdf(`Hook: ${outline.introduction.hook}`), maxLineWidth);
            hookLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
            yPosition += 2;
            const overviewLines = doc.splitTextToSize(sanitizeForPdf(`Overview: ${outline.introduction.episodeOverview}`), maxLineWidth);
            overviewLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
            yPosition += 5;

            // Segments
            outline.mainContent.forEach((segment, idx) => {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(79, 70, 229);
                ensureSpace(8);
                doc.text(sanitizeForPdf(`Segment ${idx + 1}: ${segment.segmentTitle} (${segment.duration})`), margin, yPosition);
                yPosition += 6;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 30, 30);
                ensureSpace(fieldLH + 2);
                doc.text('Key Points:', margin, yPosition);
                yPosition += fieldLH;
                doc.setFont('helvetica', 'normal');
                segment.keyPoints.forEach((pt: string) => {
                    const ptLines = doc.splitTextToSize(sanitizeForPdf(`  - ${pt}`), maxLineWidth - 8);
                    ptLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin + 4, yPosition); yPosition += fieldLH; });
                });
                yPosition += 2;

                doc.setFont('helvetica', 'bold');
                ensureSpace(fieldLH + 2);
                doc.text('Talking Points:', margin, yPosition);
                yPosition += fieldLH;
                doc.setFont('helvetica', 'normal');
                segment.talkingPoints.forEach((pt: string) => {
                    const ptLines = doc.splitTextToSize(sanitizeForPdf(`  - ${pt}`), maxLineWidth - 8);
                    ptLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin + 4, yPosition); yPosition += fieldLH; });
                });

                if (segment.supportingMaterial) {
                    yPosition += 2;
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'italic');
                    doc.setTextColor(80, 80, 80);
                    const smLines = doc.splitTextToSize(sanitizeForPdf(`Supporting: ${segment.supportingMaterial}`), maxLineWidth);
                    smLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
                }
                yPosition += 5;
            });

            // Conclusion
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            ensureSpace(6 + 3);
            doc.text(sanitizeForPdf(`Conclusion (${outline.conclusion.duration})`), margin, yPosition);
            yPosition += 6;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            const recapLines = doc.splitTextToSize(sanitizeForPdf(`Recap: ${outline.conclusion.recap}`), maxLineWidth);
            recapLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
            yPosition += 2;
            const ctaLines2 = doc.splitTextToSize(sanitizeForPdf(`CTA: ${outline.conclusion.callToAction}`), maxLineWidth);
            ctaLines2.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
            yPosition += 2;
            const teaserLines = doc.splitTextToSize(sanitizeForPdf(`Teaser: ${outline.conclusion.teaser}`), maxLineWidth);
            teaserLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
            yPosition += 5;

            // Production Notes
            if (outline.productionNotes) {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(60, 60, 80);
                ensureSpace(fieldLH * 4);
                doc.text('Production Notes', margin, yPosition);
                yPosition += 5.5;
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60, 60, 60);
                if (outline.productionNotes.music) {
                    const mLines = doc.splitTextToSize(sanitizeForPdf(`Music: ${outline.productionNotes.music}`), maxLineWidth);
                    mLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
                }
                if (outline.productionNotes.sfx) {
                    const sLines = doc.splitTextToSize(sanitizeForPdf(`SFX: ${outline.productionNotes.sfx}`), maxLineWidth);
                    sLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
                }
                if (outline.productionNotes.adSpots) {
                    const aLines = doc.splitTextToSize(sanitizeForPdf(`Ad Spots: ${outline.productionNotes.adSpots}`), maxLineWidth);
                    aLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
                }
            }

        } else if (copy.value === 'billboard' && isBillboardAdStructure(copy.marketingCopy)) {
            // Structured billboard ad rendering — entire ad kept on one page
            const ad = copy.marketingCopy;
            const fieldLineHeight = 5.2;

            // Pre-calculate total height
            const headlineLines = doc.splitTextToSize(sanitizeForPdf(ad.headline), maxLineWidth);
            const subLines = doc.splitTextToSize(sanitizeForPdf(ad.subheadline), maxLineWidth);
            const ctaLines = doc.splitTextToSize(sanitizeForPdf('CTA: ' + ad.cta), maxLineWidth);
            const vnLines = doc.splitTextToSize(sanitizeForPdf('Visual Notes: ' + ad.visualNotes), maxLineWidth);
            const ocLines = doc.splitTextToSize(sanitizeForPdf('Overall Concept: ' + ad.overallConcept), maxLineWidth);

            const totalHeight =
                (headlineLines.length * 7) + 4 +
                (subLines.length * fieldLineHeight) + 5 +
                (ctaLines.length * fieldLineHeight) + 5 +
                (vnLines.length * fieldLineHeight) + 4 +
                (ocLines.length * fieldLineHeight) + 4;

            if (yPosition + totalHeight > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }

            // Headline (large, bold)
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(18, 18, 18);
            doc.text(headlineLines, margin, yPosition);
            yPosition += (headlineLines.length * 7) + 4;

            // Subheadline
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text(subLines, margin, yPosition);
            yPosition += (subLines.length * fieldLineHeight) + 5;

            // CTA (bold, indigo-ish)
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(79, 70, 229);
            doc.text(ctaLines, margin, yPosition);
            yPosition += (ctaLines.length * fieldLineHeight) + 5;

            // Visual Notes
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(80, 80, 80);
            doc.text(vnLines, margin, yPosition);
            yPosition += (vnLines.length * fieldLineHeight) + 4;

            // Overall Concept
            doc.text(ocLines, margin, yPosition);
            yPosition += (ocLines.length * fieldLineHeight) + 4;

        } else if (copy.value === 'display ad copy' && isDisplayAdVariations(copy.marketingCopy)) {
            // Structured display ad rendering with numbered variation cards
            // Each variation is kept together on a single page (no mid-card breaks)
            const variations = copy.marketingCopy;
            const fieldLineHeight = 5.0;

            variations.forEach((v: DisplayAdVariation, idx: number) => {
                // Pre-calculate total height of this variation card
                const hlLines = doc.splitTextToSize(sanitizeForPdf(v.headline), maxLineWidth);
                const bodyTextLines = doc.splitTextToSize(sanitizeForPdf(v.body), maxLineWidth);
                const ctaLines = doc.splitTextToSize(sanitizeForPdf('CTA: ' + v.cta), maxLineWidth);
                const vnLines = doc.splitTextToSize(sanitizeForPdf('Visual Notes: ' + v.visualNotes), maxLineWidth);
                
                const cardHeight = 
                    14 +                                    // header + gap
                    5.5 + 4 +                               // separator area
                    (hlLines.length * 5.5) + 3 +            // headline
                    (bodyTextLines.length * fieldLineHeight) + 3 + // body
                    (ctaLines.length * fieldLineHeight) + 3 +     // cta
                    (vnLines.length * fieldLineHeight) + 8;       // visual notes + trailing

                // If the whole card won't fit, start a new page
                if (yPosition + cardHeight > pageHeight - margin) {
                    doc.addPage();
                    yPosition = margin;
                }

                // Variation header
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(79, 70, 229);
                doc.text(`Variation ${idx + 1} of ${variations.length}`, margin, yPosition);
                yPosition += 5.5;

                // Separator line
                doc.setDrawColor(210, 215, 225);
                doc.line(margin, yPosition, margin + maxLineWidth, yPosition);
                yPosition += 4;

                // Headline
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(18, 18, 18);
                doc.text(hlLines, margin, yPosition);
                yPosition += (hlLines.length * 5.5) + 3;

                // Body
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(40, 40, 40);
                doc.text(bodyTextLines, margin, yPosition);
                yPosition += (bodyTextLines.length * fieldLineHeight) + 3;

                // CTA
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(79, 70, 229);
                doc.text(ctaLines, margin, yPosition);
                yPosition += (ctaLines.length * fieldLineHeight) + 3;

                // Visual Notes
                doc.setFontSize(9);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(100, 100, 100);
                doc.text(vnLines, margin, yPosition);
                yPosition += (vnLines.length * fieldLineHeight) + 8;
            });
        } else if (copy.value === 'website copy' && isLandingPageStructure(copy.marketingCopy)) {
            // Structured landing page PDF rendering
            const lp = copy.marketingCopy;
            const fieldLH = 5.2;

            // Headline
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(18, 18, 18);
            const hlLines = doc.splitTextToSize(sanitizeForPdf(lp.headline), maxLineWidth);
            ensureSpace(hlLines.length * 7 + 3);
            doc.text(hlLines, margin, yPosition);
            yPosition += (hlLines.length * 7) + 3;

            // Subheadline
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            const shLines = doc.splitTextToSize(sanitizeForPdf(lp.subheadline), maxLineWidth);
            ensureSpace(shLines.length * fieldLH + 3);
            doc.text(shLines, margin, yPosition);
            yPosition += (shLines.length * fieldLH) + 3;

            // Hero CTA
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(79, 70, 229);
            ensureSpace(fieldLH + 5);
            doc.text(sanitizeForPdf('CTA: ' + lp.heroCtaText), margin, yPosition);
            yPosition += fieldLH + 5;

            // Problem
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(180, 40, 40);
            ensureSpace(6 + 3);
            doc.text('Problem', margin, yPosition);
            yPosition += 6;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 30);
            const probLines = doc.splitTextToSize(sanitizeForPdf(lp.problemStatement), maxLineWidth);
            probLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
            yPosition += 4;

            // Solution
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 120, 60);
            ensureSpace(6 + 3);
            doc.text('Solution', margin, yPosition);
            yPosition += 6;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 30);
            const solLines = doc.splitTextToSize(sanitizeForPdf(lp.solutionOverview), maxLineWidth);
            solLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
            yPosition += 4;

            // Features
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(18, 18, 18);
            ensureSpace(6 + 3);
            doc.text('Features & Benefits', margin, yPosition);
            yPosition += 6;
            lp.features.forEach((feat, idx) => {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 30, 30);
                const fTitle = sanitizeForPdf(`${idx + 1}. ${feat.title}`);
                ensureSpace(fieldLH + 2);
                doc.text(fTitle, margin, yPosition);
                yPosition += fieldLH;
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(50, 50, 50);
                const fDesc = doc.splitTextToSize(sanitizeForPdf(feat.description), maxLineWidth - 8);
                fDesc.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin + 4, yPosition); yPosition += fieldLH; });
                yPosition += 2;
            });
            yPosition += 3;

            // Social Proof
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(60, 60, 120);
            const spLines = doc.splitTextToSize(sanitizeForPdf('Social Proof: ' + lp.socialProof), maxLineWidth);
            spLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
            yPosition += 3;

            // Urgency
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(180, 100, 0);
            const urgLines = doc.splitTextToSize(sanitizeForPdf(lp.urgencyElement), maxLineWidth);
            urgLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
            yPosition += 3;

            // Final CTA
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(79, 70, 229);
            ensureSpace(fieldLH + 3);
            doc.text(sanitizeForPdf('Final CTA: ' + lp.finalCtaText), margin, yPosition);
            yPosition += fieldLH + 3;

            // Meta
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(90, 90, 90);
            ensureSpace(fieldLH * 3);
            doc.text(sanitizeForPdf('Design: ' + lp.designNotes), margin, yPosition);
            yPosition += fieldLH;
            doc.text(sanitizeForPdf('Meta Title: ' + lp.metaTitle), margin, yPosition);
            yPosition += fieldLH;
            doc.text(sanitizeForPdf('Meta Desc: ' + lp.metaDescription), margin, yPosition);
            yPosition += fieldLH + 3;

        } else if (copy.value === 'website copy' && isStandardWebsitePages(copy.marketingCopy)) {
            // Structured standard 5-page website PDF rendering
            const pages = copy.marketingCopy;
            const fieldLH = 5.2;

            pages.forEach((page, pIdx) => {
                if (pIdx > 0) {
                    doc.addPage();
                    yPosition = margin;
                    yPosition = renderPdfReportHeader(
                        doc,
                        `${copy.label} -- ${page.pageName}`,
                        yPosition, margin, maxLineWidth
                    );
                }

                // Page name heading
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(18, 18, 18);
                ensureSpace(8);
                doc.text(sanitizeForPdf(`${page.pageName} (${page.pageSlug})`), margin, yPosition);
                yPosition += 7;

                // Meta
                doc.setFontSize(9);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(90, 90, 90);
                ensureSpace(fieldLH * 2 + 4);
                doc.text(sanitizeForPdf(`Meta Title: ${page.metaTitle}`), margin, yPosition);
                yPosition += fieldLH;
                doc.text(sanitizeForPdf(`Meta Desc: ${page.metaDescription}`), margin, yPosition);
                yPosition += fieldLH + 4;

                // Sections
                page.sections.forEach((section) => {
                    // Section type badge + heading
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(79, 70, 229);
                    ensureSpace(fieldLH + 2);
                    doc.text(sanitizeForPdf(section.sectionType.toUpperCase()), margin, yPosition);
                    yPosition += fieldLH;

                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(18, 18, 18);
                    const headLines = doc.splitTextToSize(sanitizeForPdf(section.heading), maxLineWidth);
                    ensureSpace(headLines.length * 5.8 + 3);
                    doc.text(headLines, margin, yPosition);
                    yPosition += (headLines.length * 5.8) + 2;

                    if (section.subheading) {
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'italic');
                        doc.setTextColor(80, 80, 80);
                        const subLines = doc.splitTextToSize(sanitizeForPdf(section.subheading), maxLineWidth);
                        ensureSpace(subLines.length * fieldLH + 2);
                        doc.text(subLines, margin, yPosition);
                        yPosition += (subLines.length * fieldLH) + 2;
                    }

                    // Body content
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(30, 30, 30);
                    const bodyLines = doc.splitTextToSize(sanitizeForPdf(section.bodyContent), maxLineWidth);
                    bodyLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });
                    yPosition += 2;

                    if (section.ctaText) {
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(79, 70, 229);
                        ensureSpace(fieldLH + 2);
                        doc.text(sanitizeForPdf('CTA: ' + section.ctaText + (section.ctaDestination ? ' -> ' + section.ctaDestination : '')), margin, yPosition);
                        yPosition += fieldLH + 2;
                    }

                    if (section.designNotes) {
                        doc.setFontSize(9);
                        doc.setFont('helvetica', 'italic');
                        doc.setTextColor(100, 100, 100);
                        const dnLines = doc.splitTextToSize(sanitizeForPdf('Design: ' + section.designNotes), maxLineWidth);
                        ensureSpace(dnLines.length * 4.5 + 2);
                        doc.text(dnLines, margin, yPosition);
                        yPosition += (dnLines.length * 4.5) + 4;
                    } else {
                        yPosition += 4;
                    }
                });
            });

        } else if (copy.value === 'website wireframe' && isWireframeSiteStructure(copy.marketingCopy)) {
            // Structured wireframe PDF rendering
            const wf = copy.marketingCopy;
            const fieldLH = 5.0;

            // Navigation bar
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 80);
            ensureSpace(6);
            doc.text('Navigation', margin, yPosition);
            yPosition += 5.5;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            const navText = sanitizeForPdf(`[LOGO ${wf.siteNavigation.logoPosition}]  ${wf.siteNavigation.menuItems.join('  |  ')}${wf.siteNavigation.ctaButton ? '  |  [' + wf.siteNavigation.ctaButton + ']' : ''}`);
            const navLines = doc.splitTextToSize(navText, maxLineWidth);
            ensureSpace(navLines.length * fieldLH + 4);
            doc.text(navLines, margin, yPosition);
            yPosition += (navLines.length * fieldLH) + 6;

            // Pages
            wf.pages.forEach((page, pIdx) => {
                if (pIdx > 0) {
                    doc.addPage();
                    yPosition = margin;
                    yPosition = renderPdfReportHeader(
                        doc,
                        `${copy.label} -- ${page.pageName} Wireframe`,
                        yPosition, margin, maxLineWidth
                    );
                }

                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(18, 18, 18);
                ensureSpace(7);
                doc.text(sanitizeForPdf(`${page.pageName} (${page.pageSlug})`), margin, yPosition);
                yPosition += 7;

                // Draw separator
                doc.setDrawColor(200, 200, 210);
                doc.line(margin, yPosition, margin + maxLineWidth, yPosition);
                yPosition += 4;

                page.sections.forEach((section) => {
                    // Pre-calc section height
                    const nameLines = doc.splitTextToSize(sanitizeForPdf(section.sectionName + ' -- ' + section.layoutType), maxLineWidth);
                    const contentLines = doc.splitTextToSize(sanitizeForPdf(section.contentPlaceholder), maxLineWidth);
                    let sectionHeight = (nameLines.length * fieldLH) + (contentLines.length * fieldLH) + 8;
                    if (section.functionalNotes) sectionHeight += fieldLH + 2;
                    if (section.designSpecs) sectionHeight += fieldLH + 2;

                    if (yPosition + sectionHeight > pageHeight - margin) {
                        doc.addPage();
                        yPosition = margin;
                    }

                    // Section name + layout type
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(30, 30, 30);
                    doc.text(nameLines, margin, yPosition);
                    yPosition += (nameLines.length * fieldLH) + 1;

                    // Content placeholder
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(50, 50, 50);
                    doc.text(contentLines, margin + 4, yPosition);
                    yPosition += (contentLines.length * fieldLH) + 1;

                    // Functional notes
                    if (section.functionalNotes) {
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'italic');
                        doc.setTextColor(40, 80, 160);
                        const fnLines = doc.splitTextToSize(sanitizeForPdf('Functional: ' + section.functionalNotes), maxLineWidth - 8);
                        doc.text(fnLines, margin + 4, yPosition);
                        yPosition += (fnLines.length * (fieldLH - 0.5)) + 1;
                    }

                    // Design specs
                    if (section.designSpecs) {
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'italic');
                        doc.setTextColor(100, 40, 140);
                        const dsLines = doc.splitTextToSize(sanitizeForPdf('Design: ' + section.designSpecs), maxLineWidth - 8);
                        doc.text(dsLines, margin + 4, yPosition);
                        yPosition += (dsLines.length * (fieldLH - 0.5)) + 1;
                    }

                    yPosition += 4;
                });
            });

            // Footer
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 80);
            ensureSpace(20);
            doc.text('Footer', margin, yPosition);
            yPosition += 5.5;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            wf.footer.columns.forEach(col => {
                ensureSpace(fieldLH * 2);
                doc.text(sanitizeForPdf(`${col.heading}: ${col.items.join(', ')}`), margin, yPosition);
                yPosition += fieldLH;
            });
            yPosition += 3;

            // Design System
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 80);
            ensureSpace(fieldLH * 5);
            doc.text('Design System', margin, yPosition);
            yPosition += 5;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            doc.text(sanitizeForPdf('Colors: ' + wf.designSystem.colorScheme), margin, yPosition);
            yPosition += fieldLH;
            doc.text(sanitizeForPdf('Typography: ' + wf.designSystem.typography), margin, yPosition);
            yPosition += fieldLH;
            doc.text(sanitizeForPdf('Spacing: ' + wf.designSystem.spacing), margin, yPosition);
            yPosition += fieldLH + 3;

            // User Flow
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 80);
            ensureSpace(15);
            doc.text('User Flow Notes', margin, yPosition);
            yPosition += 5;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 30);
            const ufLines = doc.splitTextToSize(sanitizeForPdf(wf.userFlowNotes), maxLineWidth);
            ufLines.forEach((line: string) => { ensureSpace(fieldLH); doc.text(line, margin, yPosition); yPosition += fieldLH; });

        } else {
            // Default: render as plain text (all other content types)
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 30);

            const marketingText = sanitizeForPdf(getItemText(copy, editedCopy, editedVariants));
            const textLines = doc.splitTextToSize(marketingText, maxLineWidth);

            textLines.forEach((line: string) => {
              ensureSpace(bodyLineHeight);
              doc.text(line, margin, yPosition);
              yPosition += bodyLineHeight;
            });
        }

            doc.setTextColor(0, 0, 0);
        yPosition += 10;
      });

      doc.save(`${getFilenameBase(copies)}_marketing_copies.pdf`);

    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new Error("Could not generate PDF. Please try again.");
    }
}

export const exportHtmlForGoogleDocs = (copies: GeneratedCopyItem[], editedCopy: Record<string, string>, editedVariants?: Record<string, Record<number, string>>, editedPosts?: Record<string, Record<number, string>>) => {
    try {
            const generatedOn = new Date().toLocaleDateString();
      let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Generated Marketing Copies</title>
          <style>
                        * { box-sizing: border-box; }
                        body {
                            font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                            margin: 0;
                            background: #f4f5f8;
                            color: #15181d;
                            line-height: 1.65;
                            padding: 32px 18px;
                        }
                        .reports-root {
                            max-width: 960px;
                            margin: 0 auto;
                            display: flex;
                            flex-direction: column;
                            gap: 24px;
                        }
                        .report-sheet {
                            background: #ffffff;
                            border: 1px solid #e6e8ed;
                            border-radius: 16px;
                            box-shadow: 0 8px 30px rgba(17, 24, 39, 0.07);
                            overflow: hidden;
                            break-inside: avoid;
                            page-break-inside: avoid;
                        }
                        .report-header {
                            padding: 30px 36px 20px;
                            border-bottom: 1px solid #eceef3;
                            background: linear-gradient(180deg, #fcfcfd 0%, #ffffff 100%);
                        }
                        .report-kicker {
                            margin: 0 0 8px;
                            text-transform: uppercase;
                            letter-spacing: 0.08em;
                            font-size: 0.76rem;
                            font-weight: 700;
                            color: #64748b;
                        }
                        .report-header h1 {
                            margin: 0;
                            font-size: 2rem;
                            line-height: 1.2;
                            letter-spacing: -0.02em;
                        }
                        .report-header p {
                            margin: 10px 0 0;
                            color: #5b6472;
                            font-size: 0.95rem;
                        }
                        .report-body {
                            padding: 26px 36px;
                        }
                        .content-block {
                            padding: 26px 36px;
                            border-bottom: 1px solid #f0f2f6;
                        }
                        .content-block:last-child { border-bottom: 0; }
                        .content-type {
                            margin: 0 0 14px;
                            font-size: 1.15rem;
                            font-weight: 700;
                            letter-spacing: -0.01em;
                        }
                        .suggestion {
                            margin: 0 0 16px;
                            padding: 10px 12px;
                            border-left: 3px solid #7a869a;
                            background: #f8fafc;
                            color: #374151;
                            font-size: 0.95rem;
                        }
                        .suggestion strong { color: #111827; }
                        .blog-article {
                            border: 1px solid #e7e9ef;
                            border-radius: 14px;
                            padding: 24px;
                            margin-top: 14px;
                            background: #fff;
                        }
                        .part-label {
                            display: inline-block;
                            margin-bottom: 12px;
                            padding: 4px 10px;
                            border-radius: 999px;
                            border: 1px solid #d8deea;
                            color: #3d4a5c;
                            font-size: 0.78rem;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.06em;
                        }
                        .topic-theme {
                            margin: 0 0 8px;
                            color: #4b5563;
                            font-size: 0.9rem;
                            font-style: italic;
                        }
                        .blog-article h2 {
                            margin: 0 0 10px;
                            font-size: 1.9rem;
                            line-height: 1.22;
                            letter-spacing: -0.02em;
                            color: #101828;
                        }
                        .meta-description {
                            margin: 0 0 14px;
                            color: #4b5563;
                            font-style: italic;
                        }
                        .chip-row {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 8px;
                            margin-bottom: 18px;
                        }
                        .chip {
                            display: inline-flex;
                            align-items: center;
                            padding: 4px 10px;
                            border-radius: 999px;
                            background: #f3f7ff;
                            border: 1px solid #d9e6ff;
                            color: #1d4ed8;
                            font-size: 0.8rem;
                            font-weight: 600;
                        }
                        .takeaways {
                            background: #f7faff;
                            border: 1px solid #dbeafe;
                            border-radius: 12px;
                            padding: 14px 16px;
                            margin: 16px 0 20px;
                        }
                        .takeaways h4 {
                            margin: 0 0 8px;
                            color: #1d4ed8;
                            font-size: 0.95rem;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }
                        .takeaways ul { margin: 0; padding-left: 20px; }
                        .takeaways li { margin-bottom: 6px; }
                        .blog-section { margin: 22px 0; }
                        .blog-section h3 {
                            margin: 0 0 10px;
                            font-size: 1.25rem;
                            line-height: 1.3;
                            color: #111827;
                        }
                        .blog-section p { margin: 0 0 12px; color: #1f2937; }
                        .blog-section ul { margin: 8px 0 12px; padding-left: 22px; }
                        .blog-section li { margin-bottom: 7px; color: #1f2937; }
                        .faq {
                            margin-top: 20px;
                            padding-top: 16px;
                            border-top: 1px dashed #cfd8e3;
                        }
                        .faq h4 {
                            margin: 0 0 10px;
                            font-size: 1rem;
                            color: #1f2937;
                        }
                        .faq-q { margin: 0 0 6px; font-weight: 700; }
                        .faq-a { margin: 0; color: #374151; }
            pre {
                            margin: 0;
                            background-color: #fafbfc;
                            border: 1px solid #e5e7eb;
                            padding: 16px;
              white-space: pre-wrap;
              word-wrap: break-word;
                            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
                            font-size: 0.9rem;
                            line-height: 1.55;
                            border-radius: 10px;
              overflow-x: auto;
            }
                        .sm-post-card {
                            border: 1px solid #e5e7eb;
                            border-radius: 12px;
                            padding: 20px 24px;
                            margin-bottom: 16px;
                            background: #fff;
                        }
                        .sm-post-label {
                            margin: 0 0 10px;
                            font-size: 0.85rem;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.06em;
                            color: #6366f1;
                        }
                        .sm-post-body {
                            margin: 0;
                            white-space: pre-wrap;
                            word-wrap: break-word;
                            color: #1f2937;
                            font-size: 0.95rem;
                            line-height: 1.65;
                        }
                        .sm-images-header {
                            margin: 18px 0 10px;
                            font-size: 0.88rem;
                            font-weight: 700;
                            color: #374151;
                        }
                        .sm-images-grid {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 14px;
                            margin: 12px 0;
                        }
                        .sm-image-figure {
                            margin: 0;
                            text-align: center;
                        }
                        .sm-image-figure img {
                            max-width: 320px;
                            border-radius: 10px;
                            border: 1px solid #e5e7eb;
                        }
                        .sm-image-figure figcaption {
                            font-size: 0.78rem;
                            color: #6b7280;
                            margin-top: 4px;
                        }
                        .sm-image-single {
                            margin: 14px 0;
                            text-align: center;
                        }
                        .sm-image-single img {
                            max-width: 420px;
                            border-radius: 12px;
                            border: 1px solid #e5e7eb;
                        }
                        /* Billboard Ad styles */
                        .billboard-card { margin-top: 14px; }
                        .billboard-preview {
                            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                            color: #fff;
                            border-radius: 14px;
                            padding: 32px 28px;
                            margin-bottom: 16px;
                        }
                        .billboard-kicker {
                            font-size: 0.72rem;
                            text-transform: uppercase;
                            letter-spacing: 0.1em;
                            color: #94a3b8;
                            margin: 0 0 10px;
                            font-weight: 700;
                        }
                        .billboard-headline {
                            font-size: 2.2rem;
                            font-weight: 800;
                            margin: 0 0 10px;
                            line-height: 1.15;
                            letter-spacing: -0.02em;
                        }
                        .billboard-subheadline {
                            font-size: 1.05rem;
                            color: #cbd5e1;
                            margin: 0 0 18px;
                            line-height: 1.5;
                        }
                        .billboard-cta {
                            display: inline-block;
                            background: #fbbf24;
                            color: #1e293b;
                            font-weight: 700;
                            padding: 8px 20px;
                            border-radius: 8px;
                            font-size: 0.88rem;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }
                        .billboard-details {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 14px;
                        }
                        .billboard-detail-block {
                            background: #f8fafc;
                            border: 1px solid #e5e7eb;
                            border-radius: 10px;
                            padding: 14px 16px;
                        }
                        .billboard-detail-label {
                            font-size: 0.78rem;
                            text-transform: uppercase;
                            letter-spacing: 0.06em;
                            font-weight: 700;
                            color: #64748b;
                            margin: 0 0 6px;
                        }
                        .billboard-detail-block p:last-child {
                            margin: 0;
                            color: #1f2937;
                            font-size: 0.93rem;
                        }
                        /* Display Ad styles */
                        .display-ad-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 16px;
                            margin-top: 14px;
                        }
                        .display-ad-card {
                            border: 1px solid #e5e7eb;
                            border-radius: 12px;
                            padding: 20px;
                            background: #fff;
                        }
                        .display-ad-label {
                            font-size: 0.78rem;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.06em;
                            color: #6366f1;
                            margin: 0 0 10px;
                        }
                        .display-ad-headline {
                            font-size: 1.3rem;
                            font-weight: 700;
                            margin: 0 0 8px;
                            color: #111827;
                            line-height: 1.25;
                        }
                        .display-ad-body {
                            font-size: 0.93rem;
                            color: #374151;
                            margin: 0 0 12px;
                            line-height: 1.55;
                        }
                        .display-ad-cta {
                            display: inline-block;
                            background: #6366f1;
                            color: #fff;
                            font-weight: 600;
                            padding: 6px 16px;
                            border-radius: 6px;
                            font-size: 0.82rem;
                            text-transform: uppercase;
                            letter-spacing: 0.04em;
                            margin-bottom: 10px;
                        }
                        .display-ad-visual-notes {
                            font-size: 0.82rem;
                            color: #6b7280;
                            margin: 0;
                            padding-top: 8px;
                            border-top: 1px solid #f0f2f6;
                        }
                        /* Landing Page styles */
                        .lp-hero {
                            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                            color: #fff;
                            border-radius: 14px;
                            padding: 32px 28px;
                            margin-bottom: 16px;
                        }
                        .lp-hero h2 { margin: 0 0 8px; font-size: 2rem; font-weight: 800; line-height: 1.15; }
                        .lp-hero p { margin: 0 0 14px; color: #e0e7ff; font-size: 1.05rem; }
                        .lp-hero .lp-cta { display: inline-block; background: #fbbf24; color: #1e293b; font-weight: 700; padding: 8px 20px; border-radius: 8px; font-size: 0.88rem; text-transform: uppercase; }
                        .lp-section {
                            border: 1px solid #e5e7eb;
                            border-radius: 12px;
                            padding: 20px 24px;
                            margin-bottom: 14px;
                            background: #fff;
                        }
                        .lp-section h3 { margin: 0 0 10px; font-size: 1.15rem; color: #111827; }
                        .lp-section p { margin: 0 0 8px; color: #374151; font-size: 0.93rem; line-height: 1.55; }
                        .lp-section ul { margin: 8px 0; padding-left: 22px; }
                        .lp-section li { margin-bottom: 6px; color: #374151; }
                        .lp-features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
                        .lp-feature-card {
                            background: #f8fafc;
                            border: 1px solid #e5e7eb;
                            border-radius: 10px;
                            padding: 14px 16px;
                        }
                        .lp-feature-card strong { display: block; margin-bottom: 4px; color: #111827; }
                        .lp-feature-card p { margin: 0; font-size: 0.88rem; color: #4b5563; }
                        .lp-meta {
                            background: #f0fdf4;
                            border: 1px solid #bbf7d0;
                            border-radius: 10px;
                            padding: 14px 16px;
                            margin-top: 14px;
                        }
                        .lp-meta h4 { margin: 0 0 8px; color: #15803d; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 0.05em; }
                        .lp-meta p { margin: 0 0 4px; font-size: 0.88rem; color: #374151; }
                        /* Standard Website styles */
                        .ws-page {
                            border: 1px solid #e5e7eb;
                            border-radius: 14px;
                            margin-bottom: 18px;
                            overflow: hidden;
                            background: #fff;
                        }
                        .ws-page-header {
                            background: #f1f5f9;
                            padding: 14px 20px;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        .ws-page-header h3 { margin: 0; font-size: 1.15rem; color: #111827; }
                        .ws-page-body { padding: 20px; }
                        .ws-section {
                            border-left: 3px solid #6366f1;
                            padding: 12px 16px;
                            margin-bottom: 14px;
                            background: #fafbff;
                            border-radius: 0 8px 8px 0;
                        }
                        .ws-section-type {
                            display: inline-block;
                            padding: 2px 8px;
                            border-radius: 4px;
                            background: #eef2ff;
                            color: #4338ca;
                            font-size: 0.72rem;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            margin-bottom: 8px;
                        }
                        .ws-section h4 { margin: 0 0 6px; font-size: 1.05rem; color: #111827; }
                        .ws-section p { margin: 0 0 6px; color: #374151; font-size: 0.93rem; line-height: 1.55; }
                        .ws-section ul { margin: 6px 0; padding-left: 20px; }
                        .ws-section li { margin-bottom: 4px; color: #374151; font-size: 0.9rem; }
                        /* Wireframe styles */
                        .wf-container {
                            border: 2px dashed #94a3b8;
                            border-radius: 14px;
                            padding: 20px;
                            background: #f8fafc;
                        }
                        .wf-nav {
                            background: #e2e8f0;
                            border-radius: 8px;
                            padding: 12px 16px;
                            margin-bottom: 16px;
                            display: flex;
                            gap: 16px;
                            flex-wrap: wrap;
                        }
                        .wf-nav span { font-size: 0.88rem; font-weight: 600; color: #334155; }
                        .wf-page {
                            border: 1px dashed #cbd5e1;
                            border-radius: 10px;
                            margin-bottom: 16px;
                            overflow: hidden;
                        }
                        .wf-page-header {
                            background: #e2e8f0;
                            padding: 10px 16px;
                            border-bottom: 1px dashed #cbd5e1;
                        }
                        .wf-page-header h3 { margin: 0; font-size: 1.05rem; color: #1e293b; }
                        .wf-page-body { padding: 16px; }
                        .wf-section {
                            border: 1px dotted #94a3b8;
                            border-radius: 6px;
                            padding: 10px 14px;
                            margin-bottom: 10px;
                            background: #fff;
                        }
                        .wf-section-type {
                            display: inline-block;
                            padding: 2px 6px;
                            border-radius: 4px;
                            background: #f1f5f9;
                            color: #475569;
                            font-size: 0.7rem;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            margin-bottom: 6px;
                        }
                        .wf-section h4 { margin: 0 0 4px; font-size: 0.95rem; color: #1e293b; }
                        .wf-section p { margin: 0 0 4px; color: #475569; font-size: 0.88rem; }
                        .wf-footer {
                            background: #e2e8f0;
                            border-radius: 8px;
                            padding: 12px 16px;
                            margin-top: 16px;
                        }
                        .wf-footer p { margin: 0 0 4px; font-size: 0.88rem; color: #475569; }
                        .wf-design-system {
                            background: #fefce8;
                            border: 1px solid #fde68a;
                            border-radius: 10px;
                            padding: 14px 16px;
                            margin-top: 14px;
                        }
                        .wf-design-system h4 { margin: 0 0 8px; color: #a16207; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 0.05em; }
                        .wf-design-system p { margin: 0 0 4px; font-size: 0.88rem; color: #374151; }
                        /* Email styles */
                        .email-card {
                            border: 1px solid #e5e7eb;
                            border-radius: 14px;
                            overflow: hidden;
                            background: #fff;
                            margin-top: 14px;
                        }
                        .email-header {
                            background: #f8fafc;
                            padding: 18px 24px;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        .email-subject { margin: 0 0 4px; font-size: 1.1rem; color: #111827; }
                        .email-preheader { margin: 0; font-size: 0.88rem; color: #6b7280; }
                        .email-body { padding: 24px; }
                        .email-greeting { margin: 0 0 16px; font-size: 1rem; color: #1f2937; }
                        .email-body-paragraph { margin: 0 0 14px; color: #374151; line-height: 1.6; }
                        .email-cta-wrapper { text-align: center; margin: 20px 0; }
                        .email-cta-btn {
                            display: inline-block;
                            background: #6366f1;
                            color: #fff;
                            font-weight: 700;
                            padding: 10px 28px;
                            border-radius: 8px;
                            font-size: 0.95rem;
                            text-transform: uppercase;
                            letter-spacing: 0.04em;
                        }
                        .email-cta-url { margin: 8px 0 0; font-size: 0.82rem; color: #9ca3af; }
                        .email-footer {
                            padding: 18px 24px;
                            border-top: 1px solid #e5e7eb;
                            background: #fafbfc;
                        }
                        .email-signature { margin: 0 0 12px; color: #374151; font-size: 0.93rem; line-height: 1.5; }
                        .email-compliance { margin: 0; font-size: 0.78rem; color: #9ca3af; }
                        .email-type-badge {
                            display: inline-block;
                            margin: 12px 24px 18px;
                            padding: 4px 12px;
                            border-radius: 999px;
                            background: #eef2ff;
                            color: #4338ca;
                            font-size: 0.75rem;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.06em;
                        }
                        /* Podcast Outline styles */
                        .podcast-outline { margin-top: 14px; }
                        .podcast-title { margin: 0 0 12px; font-size: 1.8rem; color: #111827; }
                        .podcast-meta {
                            background: #f8fafc;
                            border: 1px solid #e5e7eb;
                            border-radius: 10px;
                            padding: 14px 18px;
                            margin-bottom: 18px;
                        }
                        .podcast-meta p { margin: 0 0 4px; font-size: 0.93rem; color: #374151; }
                        .podcast-section {
                            border: 1px solid #e5e7eb;
                            border-radius: 12px;
                            padding: 18px 22px;
                            margin-bottom: 14px;
                            background: #fff;
                        }
                        .podcast-section h3 { margin: 0 0 10px; font-size: 1.15rem; color: #111827; }
                        .podcast-section p { margin: 0 0 8px; color: #374151; line-height: 1.55; }
                        .podcast-duration {
                            font-size: 0.82rem;
                            font-weight: 600;
                            color: #6366f1;
                            margin-left: 6px;
                        }
                        .podcast-segment {
                            border-left: 3px solid #6366f1;
                            padding: 14px 18px;
                            margin-bottom: 14px;
                            background: #fafbff;
                            border-radius: 0 10px 10px 0;
                        }
                        .podcast-segment-title { margin: 0 0 10px; font-size: 1.1rem; color: #111827; }
                        .podcast-points { margin-bottom: 10px; }
                        .podcast-points-label { margin: 0 0 6px; font-weight: 700; font-size: 0.88rem; color: #374151; }
                        .podcast-points ul { margin: 0; padding-left: 20px; }
                        .podcast-points li { margin-bottom: 4px; color: #4b5563; font-size: 0.93rem; }
                        .podcast-supporting { margin: 8px 0 0; font-size: 0.88rem; color: #6b7280; }
                        .podcast-production {
                            background: #fffbeb;
                            border: 1px solid #fde68a;
                            border-radius: 10px;
                            padding: 14px 18px;
                            margin-top: 14px;
                        }
                        .podcast-production-title { margin: 0 0 8px; font-size: 1rem; color: #92400e; }
                        .podcast-production p { margin: 0 0 4px; font-size: 0.88rem; color: #374151; }
                        @media print {
                            body { background: #fff; padding: 0; }
                            .reports-root { gap: 0; max-width: none; }
                            .report-sheet {
                                box-shadow: none;
                                border: 0;
                                border-radius: 0;
                                break-after: page;
                                page-break-after: always;
                            }
                            .report-sheet:last-child {
                                break-after: auto;
                                page-break-after: auto;
                            }
                        }
          </style>
        </head>
        <body>
                    <main class="reports-root">
      `;

      copies.forEach(copy => {
        let marketingText;
        const isSocialMedia = copy.value === 'social media post';

                if (copy.value === 'blog post' && isBlogPostSeries(copy.marketingCopy)) {
                        marketingText = (copy.marketingCopy as BlogPostStructure[])
                            .map((post, index, arr) => blogPostToHtml(post, `Part ${index + 1} of ${arr.length}`))
                            .join('');
                } else if (copy.value === 'blog post' && isBlogPostStructure(copy.marketingCopy)) {
                        marketingText = blogPostToHtml(copy.marketingCopy as BlogPostStructure);
                } else if (isSocialMedia) {
                        marketingText = socialMediaPostsToHtml(copy, editedCopy, editedPosts);
                } else if (copy.value === 'lead generation email' && isEmailStructure(copy.marketingCopy)) {
                        marketingText = emailToHtml(copy.marketingCopy);
                } else if (copy.value === 'podcast outline' && typeof copy.marketingCopy === 'object' && !Array.isArray(copy.marketingCopy) && 'episodeTitle' in copy.marketingCopy) {
                        marketingText = podcastOutlineToHtml(copy.marketingCopy as PodcastOutlineStructure);
                } else if (copy.value === 'billboard' && isBillboardAdStructure(copy.marketingCopy)) {
                        marketingText = billboardAdToHtml(copy.marketingCopy);
                } else if (copy.value === 'display ad copy' && isDisplayAdVariations(copy.marketingCopy)) {
                        marketingText = displayAdVariationsToHtml(copy.marketingCopy);
                } else if (copy.value === 'website copy' && isLandingPageStructure(copy.marketingCopy)) {
                        marketingText = landingPageToHtml(copy.marketingCopy);
                } else if (copy.value === 'website copy' && isStandardWebsitePages(copy.marketingCopy)) {
                        marketingText = (copy.marketingCopy as WebsitePageStructure[]).map(page => standardWebsitePageToHtml(page)).join('');
                } else if (copy.value === 'website wireframe' && isWireframeSiteStructure(copy.marketingCopy)) {
                        marketingText = wireframeSiteToHtml(copy.marketingCopy);
        } else {
                        const itemText = getItemText(copy, editedCopy, editedVariants);
            const rawText = itemText;
                        marketingText = `<pre>${escapeHtml(rawText)}</pre>`;
        }
        
        htmlContent += `
                    <section class="report-sheet">
                        <header class="report-header">
                            <p class="report-kicker">Marketing Report</p>
                            <h1>${escapeHtml(copy.label)}</h1>
                            <p>Generated: ${escapeHtml(generatedOn)}</p>
                        </header>
                        <div class="report-body">
        `;
        // Image suggestions (plural + singular)
        if (copy.imageSuggestions && copy.imageSuggestions.length > 0) {
            copy.imageSuggestions.forEach((suggestion: string, idx: number) => {
                htmlContent += `<p class="suggestion"><strong>Image Variant ${idx + 1}:</strong> ${escapeHtml(suggestion)}</p>`;
            });
        } else if (copy.imageSuggestion) {
                        htmlContent += `<p class="suggestion"><strong>Image Suggestion:</strong> ${escapeHtml(copy.imageSuggestion)}</p>`;
        }
        // Embed generated images
        if (copy.generatedImages && copy.generatedImages.length > 0) {
            htmlContent += `<div class="sm-images-grid">`;
            copy.generatedImages.forEach((dataUri: string, idx: number) => {
                htmlContent += `<figure class="sm-image-figure"><img src="${dataUri}" alt="Image variant ${idx + 1}" /><figcaption>Variant ${idx + 1}</figcaption></figure>`;
            });
            htmlContent += `</div>`;
        } else if (copy.generatedImage) {
            htmlContent += `<div class="sm-image-single"><img src="${copy.generatedImage}" alt="Generated image" /></div>`;
        }
        htmlContent += marketingText;
                htmlContent += `</div></section>`;
      });

      htmlContent += `
                    </main>
        </body>
        </html>
      `;
      
      const filename = `${getFilenameBase(copies)}_marketing_copies.html`;

      const blob = new Blob([htmlContent], {
        type: 'text/html;charset=utf-8'
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("Error generating HTML for Google Docs:", error);
      throw new Error("Could not generate HTML file. Please try again.");
    }
  };
