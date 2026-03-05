
import jsPDF from 'jspdf';
import type { GeneratedCopyItem } from '@/components/page/generated-copy-display';
import type { PodcastOutlineStructure, BlogPostStructure } from '@/ai/flows/generate-marketing-copy';

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

  return content;
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
 * Falls back to splitting the edited text if available.
 */
const getSocialMediaPosts = (item: GeneratedCopyItem, editedCopy: Record<string, string>): string[] => {
    const editedText = editedCopy[item.value];
    if (editedText !== undefined) {
        // User may have edited; split on double-newline to recover individual posts
        return editedText.split(/\n\n+/).filter(p => p.trim().length > 0);
    }
    if (Array.isArray(item.marketingCopy)) {
        return item.marketingCopy.map(p => typeof p === 'string' ? p : String(p));
    }
    return [String(item.marketingCopy)];
};

/**
 * Build structured HTML for social media posts with per-post cards and embedded images.
 */
const socialMediaPostsToHtml = (item: GeneratedCopyItem, editedCopy: Record<string, string>): string => {
    const posts = getSocialMediaPosts(item, editedCopy);

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

const getItemText = (item: GeneratedCopyItem, editedCopy: Record<string, string>): string => {
    const editedText = editedCopy[item.value];
    if (editedText !== undefined) {
        return editedText;
    }
    
    // Handle podcast outlines
    if (item.value === 'podcast outline' && typeof item.marketingCopy === 'object' && !Array.isArray(item.marketingCopy) && 'episodeTitle' in item.marketingCopy) {
       return podcastOutlineToString(item.marketingCopy as PodcastOutlineStructure);
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


export const exportTextFile = (copies: GeneratedCopyItem[], editedCopy: Record<string, string>) => {
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
        const smPosts = getSocialMediaPosts(copy, editedCopy);
        smPosts.forEach((post: string, idx: number) => {
            textContent += `\n--- Post ${idx + 1} of ${smPosts.length} ---\n`;
            textContent += `${post}\n`;
        });
        textContent += `\n\n`;
    } else {
        const itemText = getItemText(copy, editedCopy);
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

export const exportPdf = (copies: GeneratedCopyItem[], editedCopy: Record<string, string>) => {
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
                const imgH = imgW;
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
            const smPosts = getSocialMediaPosts(copy, editedCopy);
            smPosts.forEach((post: string, idx: number) => {
                // Post header
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 30, 30);
                ensureSpace(14);
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
                const sanitized = sanitizeForPdf(post);
                const postLines = doc.splitTextToSize(sanitized, maxLineWidth);
                postLines.forEach((line: string) => {
                    ensureSpace(bodyLineHeight);
                    doc.text(line, margin, yPosition);
                    yPosition += bodyLineHeight;
                });

                yPosition += 6;
            });
        } else {
            // Default: render as plain text (all other content types)
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 30);

            const marketingText = sanitizeForPdf(getItemText(copy, editedCopy));
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

export const exportHtmlForGoogleDocs = (copies: GeneratedCopyItem[], editedCopy: Record<string, string>) => {
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
                        marketingText = socialMediaPostsToHtml(copy, editedCopy);
        } else {
                        const itemText = getItemText(copy, editedCopy);
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
