// src/components/education/ContentRenderer.tsx
import React, { ReactNode } from 'react';
import InteractivePoll, { PollOption } from '@/components/education/InteractivePoll';
import ImageDisplay from '@/components/education/ImageDisplay';
import TableOfContents from '@/components/education/TableOfContents';

// Define TOCItem interface to match the one in TableOfContents
interface TOCItem {
  id: string;
  title: string;
}

interface ContentRendererProps {
  content: string;
}

// This is a simplified JSX parser for educational content
// It looks for specific component patterns in the content and replaces them with actual React components
const ContentRenderer: React.FC<ContentRendererProps> = ({ content }) => {
  // Function to parse components in content
  const renderContent = (contentStr: string): ReactNode[] => {
    // Store all component matches and their positions
    type ComponentMatch = {
      type: 'poll' | 'image' | 'toc';
      match: string;
      startIndex: number;
      endIndex: number;
      component: ReactNode;
    };
    
    const componentMatches: ComponentMatch[] = [];
    const result: ReactNode[] = [];
    
    // Find all InteractivePoll components
    const pollMatches = contentStr.match(/<InteractivePoll[^>]*>[\s\S]*?<\/InteractivePoll>/g) || [];
    pollMatches.forEach(pollMatch => {
      const startIndex = contentStr.indexOf(pollMatch);
      const endIndex = startIndex + pollMatch.length;
      
      // Extract poll props
      const questionMatch = pollMatch.match(/question="([^"]*?)"/);
      const resourceIdMatch = pollMatch.match(/resourceId="([^"]*?)"/);
      const pollIdMatch = pollMatch.match(/pollId="([^"]*?)"/);
      const optionsMatch = pollMatch.match(/options={\[([\s\S]*?)\]}/);
      
      if (questionMatch?.[1] && resourceIdMatch?.[1] && pollIdMatch?.[1] && optionsMatch?.[1]) {
        const question = questionMatch[1];
        const resourceId = resourceIdMatch[1];
        const pollId = pollIdMatch[1];
        
        // Parse options
        const optionsStr = optionsMatch[1];
        // Make sure we have a valid option string
        if (optionsStr) {
          const optionObjects = optionsStr.split('},').map(opt => opt.trim());
          
          const options: PollOption[] = optionObjects.map(optStr => {
            const idMatch = optStr.match(/id: '([^']*?)'/);
            const labelMatch = optStr.match(/label: '([^']*?)'/);
            const iconMatch = optStr.match(/icon: '([^']*?)'/);
            
            // Ensure we have at least id and label
            if (idMatch?.[1] && labelMatch?.[1]) {
              return {
                id: idMatch[1],
                label: labelMatch[1],
                icon: iconMatch?.[1]
              };
            }
            
            // If we can't parse the option properly, provide a fallback
            return {
              id: 'unknown',
              label: 'Unknown option'
            };
          });
          
          // Create the poll component
          const component = (
            <InteractivePoll
              question={question}
              options={options}
              resourceId={resourceId}
              pollId={pollId}
            />
          );
          
          componentMatches.push({
            type: 'poll',
            match: pollMatch,
            startIndex,
            endIndex,
            component
          });
        }
      }
    });
    
    // Find all ImageDisplay components
    const imageMatches = contentStr.match(/<ImageDisplay[^>]*?\/>/g) || [];
    imageMatches.forEach(imageMatch => {
      const startIndex = contentStr.indexOf(imageMatch);
      const endIndex = startIndex + imageMatch.length;
      
      // Extract image props
      const srcMatch = imageMatch.match(/src="([^"]*?)"/);
      const altMatch = imageMatch.match(/alt="([^"]*?)"/);
      const captionMatch = imageMatch.match(/caption="([^"]*?)"/);
      const widthMatch = imageMatch.match(/width="([^"]*?)"/);
      const heightMatch = imageMatch.match(/height="([^"]*?)"/);
      
      if (srcMatch?.[1] && altMatch?.[1]) {
        const src = srcMatch[1];
        const alt = altMatch[1];
        const caption = captionMatch?.[1];
        const width = widthMatch?.[1];
        const height = heightMatch?.[1];
        
        // Create the image component
        const component = (
          <ImageDisplay
            src={src}
            alt={alt}
            caption={caption}
            width={width}
            height={height}
          />
        );
        
        componentMatches.push({
          type: 'image',
          match: imageMatch,
          startIndex,
          endIndex,
          component
        });
      }
    });
    
    // Find all TableOfContents components
    const tocMatches = contentStr.match(/<TableOfContents[^>]*?\/>/g) || [];
    tocMatches.forEach(tocMatch => {
      const startIndex = contentStr.indexOf(tocMatch);
      const endIndex = startIndex + tocMatch.length;
      
      // Extract items array
      const itemsMatch = tocMatch.match(/items={\[([\s\S]*?)\]}/);
      
      if (itemsMatch?.[1]) {
        const itemsStr = itemsMatch[1];
        
        // Parse the items
        const itemObjects = itemsStr.split('},').map(item => item.trim() + (item.endsWith('}') ? '' : '}'));
        
        // Parse the items and convert to TOCItem format
        const items = itemObjects
          .map(itemStr => {
            const idMatch = itemStr.match(/id: '([^']*?)'/);
            const labelMatch = itemStr.match(/label: '([^']*?)'/);
            
            if (idMatch?.[1] && labelMatch?.[1]) {
              return {
                id: idMatch[1],
                title: labelMatch[1] // Convert 'label' to 'title' for TableOfContents
              };
            }
            
            return null;
          })
          .filter((item): item is TOCItem => item !== null); // Type guard to assure non-null
        
        // Create the TableOfContents component
        const component = (
          <TableOfContents items={items} />
        );
        
        componentMatches.push({
          type: 'toc',
          match: tocMatch,
          startIndex,
          endIndex,
          component
        });
      }
    });
    
    // If no components found, return the content as HTML
    if (componentMatches.length === 0) {
      return [<div key="content" dangerouslySetInnerHTML={{ __html: contentStr }} />];
    }
    
    // Sort component matches by their position in the content
    componentMatches.sort((a, b) => a.startIndex - b.startIndex);
    
    // Split the content by the component positions and insert components
    let lastEndIndex = 0;
    
    componentMatches.forEach((match, index) => {
      // Add HTML content before this component
      if (match.startIndex > lastEndIndex) {
        const htmlPart = contentStr.substring(lastEndIndex, match.startIndex);
        if (htmlPart.trim()) {
          result.push(
            <div key={`content-${index}`} dangerouslySetInnerHTML={{ __html: htmlPart }} />
          );
        }
      }
      
      // Add the component
      result.push(React.cloneElement(match.component as React.ReactElement, { key: `component-${index}` }));
      
      lastEndIndex = match.endIndex;
    });
    
    // Add any remaining HTML content after the last component
    if (lastEndIndex < contentStr.length) {
      const htmlPart = contentStr.substring(lastEndIndex);
      if (htmlPart.trim()) {
        result.push(
          <div key={`content-${componentMatches.length}`} dangerouslySetInnerHTML={{ __html: htmlPart }} />
        );
      }
    }
    
    return result;
  };
  
  return <>{renderContent(content)}</>;
};

export default ContentRenderer;
