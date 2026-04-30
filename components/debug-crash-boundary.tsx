import {
  Component,
  useEffect,
  useState,
  type ErrorInfo,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

type CrashReport = {
  message: string;
  source: string;
  stack?: string;
};

type GlobalErrorUtils = {
  getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
  setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
};

type GlobalWithHandlers = typeof globalThis & {
  ErrorUtils?: GlobalErrorUtils;
  onunhandledrejection?: ((event: unknown) => void) | null;
};

const DEBUG_ONLY_LABEL = 'DEBUG ONLY';
const crashListeners = new Set<(report: CrashReport | null) => void>();
let latestCrashReport: CrashReport | null = null;
let handlersInstalled = false;

function stringifyUnknownValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function normalizeCrashReport(error: unknown, source: string, componentStack?: string | null): CrashReport {
  if (error instanceof Error) {
    const mergedStack = [error.stack, componentStack ? `Component stack:${componentStack}` : undefined]
      .filter(Boolean)
      .join('\n\n');

    return {
      message: error.message || error.name || 'Unknown error',
      source,
      stack: mergedStack || undefined,
    };
  }

  const message = stringifyUnknownValue(error);

  return {
    message: message || 'Unknown error',
    source,
    stack: componentStack ? `Component stack:${componentStack}` : undefined,
  };
}

function emitCrashReport(report: CrashReport) {
  latestCrashReport = report;
  console.error('[debug-crash-boundary] Captured app crash.', report);
  crashListeners.forEach((listener) => {
    listener(report);
  });
}

function readUnhandledRejectionError(event: unknown) {
  if (typeof event === 'object' && event !== null && 'reason' in event) {
    return (event as { reason?: unknown }).reason;
  }

  return event;
}

function installUnhandledRejectionHandlers() {
  const globalScope = globalThis as GlobalWithHandlers & {
    addEventListener?: (type: string, listener: (event: unknown) => void) => void;
  };

  const rejectionHandler = (event: unknown) => {
    emitCrashReport(normalizeCrashReport(readUnhandledRejectionError(event), 'unhandled-promise-rejection'));
  };

  if (typeof globalScope.addEventListener === 'function') {
    globalScope.addEventListener('unhandledrejection', rejectionHandler);
  }

  const previousUnhandledRejection = globalScope.onunhandledrejection;
  globalScope.onunhandledrejection = (event) => {
    rejectionHandler(event);
    previousUnhandledRejection?.(event);
  };
}

function installGlobalJsExceptionHandler() {
  const globalScope = globalThis as GlobalWithHandlers;
  const errorUtils = globalScope.ErrorUtils;

  if (!errorUtils?.setGlobalHandler) {
    console.log('[debug-crash-boundary] ErrorUtils global handler is unavailable.');
    return;
  }

  const previousHandler = errorUtils.getGlobalHandler?.();
  errorUtils.setGlobalHandler((error, isFatal) => {
    emitCrashReport(
      normalizeCrashReport(error, isFatal ? 'fatal-javascript-exception' : 'javascript-exception')
    );

    if (__DEV__) {
      previousHandler?.(error, isFatal);
    }
  });
}

export function installDebugCrashHandlers() {
  if (handlersInstalled) {
    return;
  }

  handlersInstalled = true;
  installGlobalJsExceptionHandler();
  installUnhandledRejectionHandlers();
}

function subscribeToCrashReports(listener: (report: CrashReport | null) => void) {
  crashListeners.add(listener);
  return () => {
    crashListeners.delete(listener);
  };
}

function DebugCrashScreen({ report }: { report: CrashReport }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{DEBUG_ONLY_LABEL}</Text>
        </View>
        <Text style={styles.title}>App crashed</Text>
        <Text style={styles.subtitle}>Temporary debug-only crash screen for APK launch troubleshooting.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Error message</Text>
          <Text style={styles.message}>{report.message}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Source</Text>
          <Text style={styles.stack}>{report.source}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Stack trace</Text>
          <Text style={styles.stack}>{report.stack ?? 'No stack available.'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

class DebugCrashBoundaryInner extends Component<PropsWithChildren, { report: CrashReport | null }> {
  state = {
    report: null,
  };

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const report = normalizeCrashReport(error, 'react-error-boundary', errorInfo.componentStack);
    this.setState({ report });
    emitCrashReport(report);
  }

  render(): ReactNode {
    if (this.state.report) {
      return <DebugCrashScreen report={this.state.report} />;
    }

    return this.props.children;
  }
}

export function DebugCrashBoundary({ children }: PropsWithChildren) {
  const [report, setReport] = useState<CrashReport | null>(() => latestCrashReport);

  useEffect(() => {
    // Temporary APK crash debugging support. Remove after launch stability is confirmed.
    installDebugCrashHandlers();
    return subscribeToCrashReports(setReport);
  }, []);

  if (report) {
    return <DebugCrashScreen report={report} />;
  }

  return <DebugCrashBoundaryInner>{children}</DebugCrashBoundaryInner>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#130A0A',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4C95D',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#27180A',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFF4F4',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#E0B4B4',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#241111',
    borderColor: '#5A2B2B',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  label: {
    color: '#F4C95D',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  message: {
    color: '#FFF4F4',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  stack: {
    color: '#F6DADA',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.select({
      android: 'monospace',
      default: 'Courier',
      ios: 'Menlo',
    }),
  },
});
