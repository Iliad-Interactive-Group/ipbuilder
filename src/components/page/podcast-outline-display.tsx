
'use client';

import React from 'react';
import type { PodcastOutlineStructure } from '@/ai/flows/generate-marketing-copy';

interface PodcastOutlineDisplayProps {
  outline: PodcastOutlineStructure;
}

const Section: React.FC<{title: string, duration: string, children: React.ReactNode}> = ({ title, duration, children }) => (
  <div className="mt-4">
    <h3 className="text-base font-semibold text-foreground">{title} <span className="text-sm font-normal text-muted-foreground">({duration})</span></h3>
    <div className="pl-4 border-l-2 border-muted mt-1 space-y-2">
      {children}
    </div>
  </div>
);

const KeyPoint: React.FC<{title: string, points: string[] | string}> = ({ title, points }) => (
  <div>
    <h4 className="font-medium text-foreground/90">{title}:</h4>
    {Array.isArray(points) ? (
      <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-1">
        {points.map((point, index) => <li key={index}>{point}</li>)}
      </ul>
    ) : (
      <p className="pl-5 text-muted-foreground">{points}</p>
    )}
  </div>
);

const PodcastOutlineDisplay: React.FC<PodcastOutlineDisplayProps> = ({ outline }) => {
  if (!outline) return null;

  return (
    <div className="bg-muted/20 p-4 rounded-md border-border/50 text-sm leading-relaxed prose prose-sm max-w-none">
      <h2 className="text-lg font-bold text-primary">{outline.episodeTitle}</h2>
      <p className="italic"><strong>Goal:</strong> {outline.episodeGoal}</p>
      <p className="italic"><strong>Target Audience:</strong> {outline.targetAudience}</p>
      <p className="italic"><strong>Target Length:</strong> {outline.totalLength}</p>
      
      <hr className="my-4"/>

      <Section title={outline.introduction.title} duration={outline.introduction.duration}>
        <KeyPoint title="Hook" points={outline.introduction.hook} />
        <KeyPoint title="Episode Overview" points={outline.introduction.episodeOverview} />
      </Section>

      {outline.mainContent.map((segment, index) => (
        <Section key={index} title={`Segment ${index + 1}: ${segment.segmentTitle}`} duration={segment.duration}>
          <KeyPoint title="Key Points" points={segment.keyPoints} />
          <KeyPoint title="Talking Points" points={segment.talkingPoints} />
          {segment.supportingMaterial && <KeyPoint title="Supporting Material" points={segment.supportingMaterial} />}
        </Section>
      ))}
      
      <Section title={outline.conclusion.title} duration={outline.conclusion.duration}>
        <KeyPoint title="Recap" points={outline.conclusion.recap} />
        <KeyPoint title="Call to Action" points={outline.conclusion.callToAction} />
        <KeyPoint title="Teaser for Next Episode" points={outline.conclusion.teaser} />
      </Section>
    </div>
  );
};

export default PodcastOutlineDisplay;

    