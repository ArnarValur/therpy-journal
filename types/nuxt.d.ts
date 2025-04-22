import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { Router } from 'vue-router';

interface ColorMode {
  preference: string
  value: string
  unknown: boolean
  forced: boolean
}

declare module '#app' {
  interface NuxtApp {
    $firebaseDb: Firestore
    $firebaseAuth: Auth
    $colorMode: ColorMode
    $router: Router
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $firebaseDb: Firestore
    $firebaseAuth: Auth
    $colorMode: ColorMode
    $router: Router
  }
}

export { } 