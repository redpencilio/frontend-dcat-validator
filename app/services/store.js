import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';
import { setBuildURLConfig } from '@warp-drive/utilities';
import { schemas } from 'rpio-dcat-validator/schemas';

setBuildURLConfig({
  host: '',
  namespace: '',
});

const Store = useRecommendedStore({
  cache: JSONAPICache,
  schemas,
});

export default Store;
