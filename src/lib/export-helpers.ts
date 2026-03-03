
import jsPDF from 'jspdf';
import type { GeneratedCopyItem } from '@/components/page/generated-copy-display';
import type { PodcastOutlineStructure, BlogPostStructure } from '@/ai/flows/generate-marketing-copy';

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
    if (copy.imageSuggestion) {
      textContent += `Image Suggestion: ${copy.imageSuggestion}\n`;
    }
    textContent += `------------------------------------------\n`;
    
    const itemText = getItemText(copy, editedCopy);
    textContent += `${itemText}\n\n\n`;
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

export const exportPdf = (copies: GeneratedCopyItem[], editedCopy: Record<string, string>) => {
    try {
      const doc = new jsPDF();
      let yPosition = 15;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      const maxLineWidth = pageWidth - margin * 2;
    const bodyLineHeight = 5.2;

      doc.setFontSize(18);
      const mainTitle = "Generated Marketing Copies";
      const mainTitleWidth = doc.getTextWidth(mainTitle);
      doc.text(mainTitle, (pageWidth - mainTitleWidth) / 2, yPosition);
      yPosition += 10;

      copies.forEach((copy) => {
        const ensureSpace = (neededHeight: number) => {
          if (yPosition + neededHeight > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
        };

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(24, 24, 24);
        const labelLineHeight = 6;
        const contentTypeLabel = `Content Type: ${copy.label}`;
        const labelLines = doc.splitTextToSize(contentTypeLabel, maxLineWidth);
        ensureSpace(labelLines.length * labelLineHeight);
        doc.text(labelLines, margin, yPosition);
        yPosition += (labelLines.length * labelLineHeight) + 1;
        doc.setDrawColor(230, 230, 230);
        doc.line(margin, yPosition, margin + maxLineWidth, yPosition);
        yPosition += 4;

        if (copy.imageSuggestion) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(85, 85, 85);
            const suggestionLineHeight = 4.8;
            const suggestionText = `Image Suggestion: ${copy.imageSuggestion}`;
            const suggestionLines = doc.splitTextToSize(suggestionText, maxLineWidth);
            ensureSpace(suggestionLines.length * suggestionLineHeight + 4);
            doc.text(suggestionLines, margin, yPosition);
            yPosition += (suggestionLines.length * suggestionLineHeight) + 3;
        }

        // Blog posts get structured PDF rendering with proper formatting
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

        if (isBlogSeries) {
            (copy.marketingCopy as BlogPostStructure[]).forEach((post, idx) => {
                // Part separator with a horizontal rule
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                ensureSpace(20);
                const partLabel = `\u2014\u2014 Part ${idx + 1} of ${(copy.marketingCopy as BlogPostStructure[]).length} \u2014\u2014`;
                doc.text(partLabel, margin, yPosition);
                yPosition += 8;

                yPosition = renderBlogPostToPdf(doc, post, yPosition, margin, maxLineWidth, pageHeight, 1.15);
                yPosition += 8;
            });
        } else if (isSingleBlog) {
            yPosition = renderBlogPostToPdf(doc, copy.marketingCopy as BlogPostStructure, yPosition, margin, maxLineWidth, pageHeight, 1.15);
        } else {
            // Default: render as plain text (all other content types)
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 30);
            const textLineHeight = bodyLineHeight;
            
            const marketingText = getItemText(copy, editedCopy);
            const textLines = doc.splitTextToSize(marketingText, maxLineWidth);
            
            textLines.forEach((line: string) => {
              ensureSpace(textLineHeight);
              doc.text(line, margin, yPosition);
              yPosition += textLineHeight;
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
                        .container {
                            max-width: 960px;
                            margin: 0 auto;
                            background: #ffffff;
                            border: 1px solid #e6e8ed;
                            border-radius: 16px;
                            box-shadow: 0 8px 30px rgba(17, 24, 39, 0.07);
                            overflow: hidden;
                        }
                        .page-header {
                            padding: 30px 36px 20px;
                            border-bottom: 1px solid #eceef3;
                            background: linear-gradient(180deg, #fcfcfd 0%, #ffffff 100%);
                        }
                        .page-header h1 {
                            margin: 0;
                            font-size: 2rem;
                            line-height: 1.2;
                            letter-spacing: -0.02em;
                        }
                        .page-header p {
                            margin: 10px 0 0;
                            color: #5b6472;
                            font-size: 0.95rem;
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
                        @media print {
                            body { background: #fff; padding: 0; }
                            .container { box-shadow: none; border: 0; border-radius: 0; }
                        }
          </style>
        </head>
        <body>
                    <main class="container">
                        <header class="page-header">
                            <h1>Generated Marketing Copies</h1>
                            <p>Client-ready marketing deliverables prepared for presentation and handoff.</p>
                        </header>
      `;

      copies.forEach(copy => {
        let marketingText;

                if (copy.value === 'blog post' && isBlogPostSeries(copy.marketingCopy)) {
                        marketingText = (copy.marketingCopy as BlogPostStructure[])
                            .map((post, index, arr) => blogPostToHtml(post, `Part ${index + 1} of ${arr.length}`))
                            .join('');
                } else if (copy.value === 'blog post' && isBlogPostStructure(copy.marketingCopy)) {
                        marketingText = blogPostToHtml(copy.marketingCopy as BlogPostStructure);
        } else {
                        const itemText = getItemText(copy, editedCopy);
            const rawText = itemText;
                        marketingText = `<pre>${escapeHtml(rawText)}</pre>`;
        }
        
        htmlContent += `
                    <section class="content-block">
                        <h2 class="content-type">Content Type: ${escapeHtml(copy.label)}</h2>
        `;
        if (copy.imageSuggestion) {
                        htmlContent += `<p class="suggestion"><strong>Image Suggestion:</strong> ${escapeHtml(copy.imageSuggestion)}</p>`;
        }
        htmlContent += marketingText;
                htmlContent += `</section>`;
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
