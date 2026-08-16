fetch('http://localhost:3000/api/optimize-allocation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    suppliers: [{id: 1, capacity: 5000, cost: 100, otd: 90, riskScore: 10, moq: 1000}],
    totalDemand: 10000
  })
}).then(r => r.text()).then(console.log).catch(console.error);
