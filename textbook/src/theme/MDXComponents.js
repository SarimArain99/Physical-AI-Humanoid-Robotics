import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import ChapterTools from '@site/src/components/ChapterTools';

export default {
  // Re-use the default mapping
  ...MDXComponents,
  // Add our custom component
  ChapterTools,
};
