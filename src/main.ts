import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  PreloadAllModules,
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';

import {
  ActionSheetController,
  AlertController,
  ModalController,
} from '@ionic/angular';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { IonicStorageModule } from '@ionic/storage-angular';
import 'hammerjs';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

defineCustomElements(window);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    importProvidersFrom(IonicStorageModule.forRoot({})),
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    ActionSheetController,
    AlertController,
    ModalController,
  ],
});
