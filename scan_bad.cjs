const fs = require('fs');
const files = [
  'src/pages/admin/CRMPipeline.jsx',
  'src/pages/admin/PaymentTracker.jsx',
  'src/pages/admin/CalendarPage.jsx',
  'src/pages/admin/EstimatesList.jsx',
  'src/pages/admin/ProjectDetail.jsx',
  'src/pages/admin/ReportsPage.jsx',
  'src/pages/Estimator.jsx',
  'src/pages/Materials.jsx',
  'src/pages/supervisor/DailyReports.jsx',
  'src/components/estimator/WindowsConfigurator.jsx',
  'src/components/estimator/RoofingConfigurator.jsx',
  'src/components/estimator/SidingConfigurator.jsx',
  'src/components/estimator/GutterConfigurator.jsx',
];
const BAD = /[\u00C3\u00C2][\u0080-\u00BF]/g;
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (BAD.test(line)) {
      console.log(f.split('/').pop() + ':L' + (i + 1) + ' | ' + line.trim().slice(0, 120));
      BAD.lastIndex = 0;
    }
  });
}
