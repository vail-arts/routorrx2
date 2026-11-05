import tseslint from 'typescript-eslint';
export default tseslint.config({ignores:['node_modules/**','.next/**','public/vendor/**','next-env.d.ts']},...tseslint.configs.recommended,{files:['**/*.ts','**/*.tsx'],rules:{'@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_'}],'@typescript-eslint/no-explicit-any':'error'}});
