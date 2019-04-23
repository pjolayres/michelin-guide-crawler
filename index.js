import program from './src/program';

(async () => {
  try {
    await program();
  }
  catch (ex) {
    throw ex;
  }
})();
