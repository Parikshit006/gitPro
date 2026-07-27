const fs = require('fs');
const path = require('path');

const filesToFix = [
  {
    path: 'src/components/charts/CommitVelocityChart.tsx',
    replacements: [[/import React from 'react';\n/, '']]
  },
  {
    path: 'src/components/charts/HealthGauge.tsx',
    replacements: [[/import React, \{ useEffect, useState \} from 'react';/, "import { useEffect, useState } from 'react';"]]
  },
  {
    path: 'src/components/ConnectRepositoryModal.tsx',
    replacements: [
      [/import \{ Github \} from 'lucide-react';/, "import { GitBranch } from 'lucide-react';"],
      [/<Github/g, "<GitBranch"]
    ]
  },
  {
    path: 'src/components/ReportPreviewModal.tsx',
    replacements: [
      [/import React from 'react';\n/, ''],
      [/import \{ Download, ExternalLink \} from 'lucide-react';/, "import { Download } from 'lucide-react';"]
    ]
  },
  {
    path: 'src/components/ui/EmptyState.tsx',
    replacements: [
      [/import React from 'react';\n/, ''],
      [/import \{ LucideIcon \} from 'lucide-react';/, "import type { LucideIcon } from 'lucide-react';"]
    ]
  },
  {
    path: 'src/components/ui/ErrorState.tsx',
    replacements: [
      [/import React, \{ useState \} from 'react';/, "import { useState } from 'react';"]
    ]
  },
  {
    path: 'src/components/ui/KPICard.tsx',
    replacements: [
      [/import React from 'react';\n/, ''],
      [/import \{ LucideIcon \} from 'lucide-react';/, "import type { LucideIcon } from 'lucide-react';"]
    ]
  },
  {
    path: 'src/components/ui/RecommendationCard.tsx',
    replacements: [
      [/import React from 'react';\n/, '']
    ]
  },
  {
    path: 'src/components/ui/Skeleton.tsx',
    replacements: [
      [/import React from 'react';\n/, '']
    ]
  },
  {
    path: 'src/components/ui/StatusDot.tsx',
    replacements: [
      [/import React from 'react';\n/, '']
    ]
  },
  {
    path: 'src/pages/DashboardPage.tsx',
    replacements: [
      [/import React from 'react';\n/, '']
    ]
  },
  {
    path: 'src/pages/LoginPage.tsx',
    replacements: [
      [/import \{ Github \} from 'lucide-react';/, "import { GitBranch } from 'lucide-react';"],
      [/<Github/g, "<GitBranch"]
    ]
  },
  {
    path: 'src/pages/RepositoriesPage.tsx',
    replacements: [
      [/import React, \{ useState \} from 'react';/, "import { useState } from 'react';"]
    ]
  },
  {
    path: 'src/pages/RepositoryDetailPage.tsx',
    replacements: [
      [/import React, \{ useState \} from 'react';/, "import { useState } from 'react';"]
    ]
  },
  {
    path: 'src/pages/tabs/ActivityTab.tsx',
    replacements: [
      [/import React from 'react';\n/, '']
    ]
  },
  {
    path: 'src/pages/tabs/DevelopersTab.tsx',
    replacements: [
      [/import React from 'react';\n/, '']
    ]
  },
  {
    path: 'src/pages/tabs/HealthTab.tsx',
    replacements: [
      [/import React from 'react';\n/, '']
    ]
  },
  {
    path: 'src/pages/tabs/HotspotsTab.tsx',
    replacements: [
      [/import React from 'react';\n/, ''],
      [/import \{ Card \} from '\.\.\/\.\.\/components\/ui\/Card';\n/, ''],
      [/const color = getVariantColor\(variant\);\n/, '']
    ]
  },
  {
    path: 'src/pages/tabs/OverviewTab.tsx',
    replacements: [
      [/import React from 'react';\n/, '']
    ]
  }
];

filesToFix.forEach(fileInfo => {
  const fullPath = path.join(__dirname, fileInfo.path);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    fileInfo.replacements.forEach(([search, replace]) => {
      content = content.replace(search, replace);
    });
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed', fileInfo.path);
  } else {
    console.log('File not found', fileInfo.path);
  }
});
