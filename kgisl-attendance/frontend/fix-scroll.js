const fs = require('fs');
const files = [
  'AddFacultyPage.jsx', 'AnalyticsDashboard.jsx', 'CoursesPage.jsx', 
  'LogsPage.jsx', 'SettingsPage.jsx', 'StudentsPage.jsx', 'TimetablePage.jsx'
];
files.forEach(file => {
  const path = 'src/pages/' + file;
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/<div className="flex min-h-screen bg-transparent">/g, '<div className="flex h-full w-full bg-transparent overflow-hidden">');
  content = content.replace(/<main className="flex-1 min-w-0 pb-10">/g, '<main className="flex-1 min-w-0 overflow-y-auto scroll-smooth pb-10 h-full">');
  content = content.replace(/<main className="flex-1 min-w-0 flex flex-col">/g, '<main className="flex-1 min-w-0 flex flex-col overflow-y-auto scroll-smooth h-full">');
  fs.writeFileSync(path, content, 'utf8');
});
console.log('Fixed scrolling in all pages');
