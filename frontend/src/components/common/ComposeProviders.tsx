import React, { ComponentType, ReactNode } from "react";

interface ComposeProvidersProps {
  providers: ComponentType<{ children: ReactNode }>[];
  children: ReactNode;
}

/**
 * ComposeProviders flattens deeply nested context provider trees
 * into a clean, flat declarative array of providers.
 */
export function ComposeProviders({ providers, children }: ComposeProvidersProps) {
  return (
    <>
      {providers.reduceRight(
        (acc, Provider) => (
          <Provider>{acc}</Provider>
        ),
        children
      )}
    </>
  );
}
