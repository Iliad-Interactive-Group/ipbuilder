
'use client';

import React from 'react';
import type { BlogPostStructure } from '@/ai/flows/generate-marketing-copy';

interface BlogPostDisplayProps {
  post: BlogPostStructure;
}

const BlogPostDisplay: React.FC<BlogPostDisplayProps> = ({ post }) => {
  if (!post) return null;

  return (
    <div className="bg-muted/20 p-4 rounded-md border-border/50 text-sm leading-relaxed prose prose-sm max-w-none">
      <h2 className="text-xl font-bold text-primary mb-4">{post.title}</h2>
      
      {post.sections.map((section, index) => (
        <section key={index} className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-2">{section.heading}</h3>
          <div className="space-y-3">
            {section.contentItems.map((item, itemIndex) => {
              if (item.type === 'paragraph') {
                return <p key={itemIndex}>{item.text}</p>;
              } else if (item.type === 'list') {
                return (
                  <ul key={itemIndex} className="list-disc pl-5 space-y-1">
                    {item.items.map((listItem, listIndex) => (
                      <li key={listIndex}>{listItem}</li>
                    ))}
                  </ul>
                );
              }
              return null;
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default BlogPostDisplay;
