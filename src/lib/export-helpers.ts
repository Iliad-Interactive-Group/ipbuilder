
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
    let content = `Blog Post\n\n`;
    content += `Title: ${post.title}\n\n`;
    
    post.sections.forEach(section => {
        content += `--- ${section.heading} ---\n`;
        section.contentItems.forEach(item => {
            if (item.paragraph) {
                content += `${item.paragraph}\n\n`;
            } else if (item.listItems) {
                content += item.listItems.map(li => `  - ${li}`).join('\n') + '\n\n';
            }
        });
    });

    return content;
};

const getFilenameBase = (copies: GeneratedCopyItem[]): string => {
    if (!copies || copies.length === 0) return "marketing";
    const firstContentTypeLabel = copies[0].label || "marketing";
    return `${firstContentTypeLabel.toLowerCase().replace(/\s+/g, '_').substring(0,20)}`;
}

const getItemText = (item: GeneratedCopyItem, editedCopy: Record<string, string>): string => {
    const editedText = editedCopy[item.value];
    if (editedText !== undefined) {
        return editedText;
    }
    
    if (item.value === 'podcast outline' && typeof item.marketingCopy === 'object' && !Array.isArray(item.marketingCopy) && 'episodeTitle' in item.marketingCopy) {
       return podcastOutlineToString(item.marketingCopy as PodcastOutlineStructure);
    } else if (item.value === 'blog post' && typeof item.marketingCopy === 'object' && !Array.isArray(item.marketingCopy) && 'sections' in item.marketingCopy) {
       return blogPostToString(item.marketingCopy as BlogPostStructure);
    } else {
       return Array.isArray(item.marketingCopy) ? item.marketingCopy.join('\n\n') : String(item.marketingCopy);
    }
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

export const exportPdf = (copies: GeneratedCopyItem[], editedCopy: Record<string, string>) => {
    try {
      const doc = new jsPDF();
      let yPosition = 15;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      const maxLineWidth = pageWidth - margin * 2;
      const lineHeightFactor = 1.15;

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

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const labelLineHeight = 14 * lineHeightFactor;
        const contentTypeLabel = `Content Type: ${copy.label}`;
        const labelLines = doc.splitTextToSize(contentTypeLabel, maxLineWidth);
        ensureSpace(labelLines.length * labelLineHeight);
        doc.text(labelLines, margin, yPosition);
        yPosition += (labelLines.length * labelLineHeight) + 2;

        if (copy.imageSuggestion) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            const suggestionLineHeight = 10 * lineHeightFactor;
            const suggestionText = `Image Suggestion: ${copy.imageSuggestion}`;
            const suggestionLines = doc.splitTextToSize(suggestionText, maxLineWidth);
            ensureSpace(suggestionLines.length * suggestionLineHeight + 4);
            doc.text(suggestionLines, margin, yPosition);
            yPosition += (suggestionLines.length * suggestionLineHeight) + 5;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const textLineHeight = 10 * lineHeightFactor;
        
        const marketingText = getItemText(copy, editedCopy);
        const textLines = doc.splitTextToSize(marketingText, maxLineWidth);
        
        textLines.forEach((line: string) => {
          ensureSpace(textLineHeight);
          doc.text(line, margin, yPosition);
          yPosition += textLineHeight;
        });

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
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            h1 { font-size: 1.8em; margin-bottom: 15px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px;}
            h2 { font-size: 1.4em; margin-top: 20px; margin-bottom: 8px; color: #555; }
            h3 { font-size: 1.2em; margin-top: 15px; margin-bottom: 5px; color: #666; }
            h4 { font-size: 1.1em; margin-top: 10px; margin-bottom: 5px; color: #777; }
            p.suggestion { font-style: italic; color: #777; margin-top: -5px; margin-bottom: 10px; }
            pre {
              background-color: #f8f8f8;
              border: 1px solid #ddd;
              padding: 15px;
              white-space: pre-wrap;
              word-wrap: break-word;
              font-family: Consolas, 'Courier New', monospace;
              font-size: 0.95em;
              border-radius: 4px;
              overflow-x: auto;
            }
            div.structured-content { border: 1px solid #ddd; padding: 15px; border-radius: 4px; background-color: #fdfdfd; }
            ul { margin-top: 5px; }
            div { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Generated Marketing Copies</h1>
      `;

      copies.forEach(copy => {
        let marketingText;
        const itemText = getItemText(copy, editedCopy);

        if (copy.value === 'podcast outline' || copy.value === 'blog post') {
            const rawHtml = itemText
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;")
              .replace(/\n/g, '<br>');
            marketingText = `<div class="structured-content">${rawHtml}</div>`;
        } else {
            const rawText = itemText;
            marketingText = `<pre>${rawText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
        }
        
        htmlContent += `
          <div>
            <h2>Content Type: ${copy.label}</h2>
        `;
        if (copy.imageSuggestion) {
            htmlContent += `<p class="suggestion"><b>Image Suggestion:</b> ${copy.imageSuggestion.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
        }
        htmlContent += marketingText;
        htmlContent += `</div>`;
      });

      htmlContent += `
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
