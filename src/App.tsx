/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MainAppShell } from './components/layout/MainAppShell.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';

export default function App() {
  return (
    <ErrorBoundary>
      <MainAppShell />
    </ErrorBoundary>
  );
}
