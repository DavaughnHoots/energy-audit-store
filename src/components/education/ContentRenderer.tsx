// src/components/education/ContentRenderer.tsx
import React, { ReactNode } from 'react';
import InteractivePoll, { PollOption } from '@/components/education/InteractivePoll';

interface ContentRendererProps {
  content: string;
}

// This is a simplified JSX parser for educational content
// It looks for specific component patterns in the content and replaces them with actual React components
const ContentRenderer: React.FC<ContentRendererProps> = ({ content }) => {
  // Function to parse InteractivePoll components in content
  const renderContent = (contentStr: string): ReactNode[] => {
    const result: ReactNode[] = [];
    
    // Split content by potential component tags
    const parts = contentStr.split(/<InteractivePoll[^>]*>|<\/InteractivePoll>/);
    
    // Find all InteractivePoll tags
    const pollMatches = contentStr.match(/<InteractivePoll[^>]*>[\s\S]*?<\/InteractivePoll>/g);
    
    // If no InteractivePoll components found, return the content as HTML
    if (!pollMatches) {
      return [<div key="content" dangerouslySetInnerHTML={{ __html: contentStr }} />];
    }
    
    // Process each part
    parts.forEach((part, index) => {
      if (part.trim()) {
        // This is a text part, render as HTML
        result.push(
          <div key={`content-${index}`} dangerouslySetInnerHTML={{ __html: part }} />
        );
      }
      
      // After each text part, there might be a poll (except after the last text part)
      if (pollMatches && index < pollMatches.length) {
        const pollMatch = pollMatches[index];
        
        if (pollMatch) {
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
              
              // Add the poll component
              result.push(
                <InteractivePoll
                  key={`poll-${index}`}
                  question={question}
                  options={options}
                  resourceId={resourceId}
                  pollId={pollId}
                />
              );
            }
          }
        }
      }
    });
    
    return result;
  };
  
  return <>{renderContent(content)}</>;
};

export default ContentRenderer;
