import { inject, Injectable, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';

const CHECK_INTERVAL_MS = 60_000; // poll for new code every minute

/**
 * Keeps the installed PWA fresh: checks for new deployments frequently and on
 * focus/online, and surfaces a banner when a new version is ready to apply.
 */
@Injectable({ providedIn: 'root' })
export class UpdateService {
  private readonly sw = inject(SwUpdate);
  readonly updateReady = signal(false);

  init(): void {
    if (!this.sw.isEnabled) return;

    this.sw.versionUpdates.subscribe((evt) => {
      if ((evt as VersionReadyEvent).type === 'VERSION_READY') {
        this.updateReady.set(true);
      }
    });

    const check = () => {
      void this.sw.checkForUpdate().catch(() => {});
    };

    check();
    setInterval(check, CHECK_INTERVAL_MS);
    addEventListener('focus', check);
    addEventListener('online', check);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) check();
    });
  }

  async apply(): Promise<void> {
    try {
      await this.sw.activateUpdate();
    } finally {
      location.reload();
    }
  }
}
