const logMemory = () => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`[MEMORY USE]: ${Math.round(used * 100) / 100} MB`);
  setTimeout(() => {
    logMemory();
  }, 10000);
};

module.exports = { logMemory };
