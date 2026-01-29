declare module '@capacitor/app' {
  export interface BackButtonListener {
    remove: () => Promise<void>
  }

  export interface BackButtonEvent {
    canGoBack: boolean
  }

  export const App: {
    addListener(
      event: 'backButton',
      callback: (event: BackButtonEvent) => void
    ): Promise<BackButtonListener>
    exitApp(): Promise<void>
  }
}
