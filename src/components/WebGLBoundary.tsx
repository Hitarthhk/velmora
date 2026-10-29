"use client";

import { Component, type ReactNode } from "react";

/** Keep content available when a GPU context or model cannot initialize. */
export class WebGLBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onError?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError?.(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
