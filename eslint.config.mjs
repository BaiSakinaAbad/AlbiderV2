import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
import tseslint from 'typescript-eslint';
import eslintJs from '@eslint/js';

export default tseslint.config(
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**/*', 'node_modules/**/*']
  },
  firebaseRulesPlugin.configs['flat/recommended']
);
