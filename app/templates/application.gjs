import { pageTitle } from 'ember-page-title';
import AppHeader from 'rpio-dcat-validator/components/app-header';
import AppFooter from 'rpio-dcat-validator/components/app-footer';

<template>
  {{pageTitle "mobilityDCAT-AP Validator"}}

  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <main class="flex-1">
      {{outlet}}
    </main>
    <AppFooter />
  </div>
</template>
