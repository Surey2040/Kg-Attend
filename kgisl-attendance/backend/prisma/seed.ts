import { prisma } from '../src/config/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const passwordHash = await bcrypt.hash('pass@123', 10);

  // 1. Create Batches
  const batchNames = ['II MCA A', 'II MCA B', 'II MCA C'];
  const batches: any = {};
  for (const name of batchNames) {
    batches[name] = await prisma.batch.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 2. Create Students from real data and assign based on roll number ranges
  const studentsData: any[] = [
    { rollNo: '25MCA01', regNo: '2538M0054', name: 'ABDULLAH NIYAS A' },
    { rollNo: '25MCA02', regNo: '2538M0055', name: 'ABINESH R' },
    { rollNo: '25MCA03', regNo: '2538M0056', name: 'ABISHEK KUMAR V' },
    { rollNo: '25MCA04', regNo: '2538M0057', name: 'ADHARSHAA A' },
    { rollNo: '25MCA05', regNo: '2538M0058', name: 'AISHWARYA P' },
    { rollNo: '25MCA06', regNo: '2538M0059', name: 'AKSHATHA B' },
    { rollNo: '25MCA07', regNo: '2538M0060', name: 'ALAGIRI K' },
    { rollNo: '25MCA08', regNo: '2538M0061', name: 'AMAL C SIMON' },
    { rollNo: '25MCA09', regNo: '2538M0062', name: 'AMBIKA G' },
    { rollNo: '25MCA10', regNo: '2538M0063', name: 'ANANDHA VIGNESH K' },
    { rollNo: '25MCA11', regNo: '2538M0064', name: 'ANIRUDHAN A' },
    { rollNo: '25MCA12', regNo: '2538M0065', name: 'ANUSHREE A' },
    { rollNo: '25MCA13', regNo: '2538M0066', name: 'APOORVAA G J' },
    { rollNo: '25MCA14', regNo: '2538M0067', name: 'ARAVINTHAN M' },
    { rollNo: '25MCA15', regNo: '2538M0068', name: 'ASHWATHY RAJKUMAR' },
    { rollNo: '25MCA16', regNo: '2538M0069', name: 'BARATHKUMAR S' },
    { rollNo: '25MCA17', regNo: '2538M0070', name: 'CHANTHRIHA J' },
    { rollNo: '25MCA18', regNo: '2538M0071', name: 'CHARAN V' },
    { rollNo: '25MCA19', regNo: '2538M0072', name: 'CHARLES JEYASEELAN A' },
    { rollNo: '25MCA20', regNo: '2538M0073', name: 'DEEPAK P' },
    { rollNo: '25MCA21', regNo: '2538M0074', name: 'DEEPAK RAJ D' },
    { rollNo: '25MCA22', regNo: '2538M0075', name: 'DHANUSH B' },
    { rollNo: '25MCA23', regNo: '2538M0076', name: 'DHANUSH S' },
    { rollNo: '25MCA24', regNo: '2538M0077', name: 'DHARSHAN S' },
    { rollNo: '25MCA25', regNo: '2538M0078', name: 'DHIVAYADHARSHINI S' },
    { rollNo: '25MCA26', regNo: '2538M0079', name: 'DHRUV N K' },
    { rollNo: '25MCA27', regNo: '2538M0080', name: 'DINESH T' },
    { rollNo: '25MCA28', regNo: '2538M0081', name: 'DIVAKARAN L' },
    { rollNo: '25MCA29', regNo: '2538M0082', name: 'DIVYA BHARATHI S' },
    { rollNo: '25MCA30', regNo: '2538M0083', name: 'DURGA DEVI R' },
    { rollNo: '25MCA31', regNo: '2538M0084', name: 'ENBASELVAN S' },
    { rollNo: '25MCA125', regNo: '2538M0085', name: 'FATHIMA AAFRIN R H' },
    { rollNo: '25MCA32', regNo: '2538M0086', name: 'GIRINANDHA T' },
    { rollNo: '25MCA33', regNo: '2538M0087', name: 'GNANASANKAR M' },
    { rollNo: '25MCA34', regNo: '2538M0088', name: 'GOKUL B' },
    { rollNo: '25MCA35', regNo: '2538M0089', name: 'GOPINAATH A' },
    { rollNo: '25MCA36', regNo: '2538M0090', name: 'GOWTHAM S' },
    { rollNo: '25MCA37', regNo: '2538M0091', name: 'GURUPRASATH G' },
    { rollNo: '25MCA38', regNo: '2538M0092', name: 'HARDEEP P' },
    { rollNo: '25MCA39', regNo: '2538M0093', name: 'HARI GANESH S' },
    { rollNo: '25MCA40', regNo: '2538M0094', name: 'HARI KRISHNAN K' },
    { rollNo: '25MCA41', regNo: '2538M0095', name: 'HARISHKANNAN T' },
    { rollNo: '25MCA42', regNo: '2538M0096', name: 'HARISHKUMAR S' },
    { rollNo: '25MCA43', regNo: '2538M0097', name: 'HARSHA B H' },
    { rollNo: '25MCA44', regNo: '2538M0098', name: 'HARSHITHA P J' },
    { rollNo: '25MCA45', regNo: '2538M0099', name: 'IKSON RAJ I' },
    { rollNo: '25MCA46', regNo: '2538M0101', name: 'JAYAKUMAR J' },
    { rollNo: '25MCA47', regNo: '2538M0100', name: 'JAYA PRIYA L' },
    { rollNo: '25MCA48', regNo: '2538M0102', name: 'JERLIN REETTA J' },
    { rollNo: '25MCA49', regNo: '2538M0103', name: 'KAVIN C' },
    { rollNo: '25MCA52', regNo: '2538M0106', name: 'KAVIYARASU K' },
    { rollNo: '25MCA53', regNo: '2538M0107', name: 'KAVYA R' },
    { rollNo: '25MCA54', regNo: '2538M0108', name: 'KEERTHANA R' },
    { rollNo: '25MCA55', regNo: '2538M0109', name: 'KISHORE C' },
    { rollNo: '25MCA56', regNo: '2538M0110', name: 'KISHORE RAM R' },
    { rollNo: '25MCA57', regNo: '2538M0112', name: 'MAHALAKSHMI S' },
    { rollNo: '25MCA58', regNo: '2538M0111', name: 'MAHA VISHNU P' },
    { rollNo: '25MCA59', regNo: '2538M0113', name: 'MOHAMED M A' },
    { rollNo: '25MCA60', regNo: '2538M0114', name: 'MOURISHWARAN T' },
    { rollNo: '25MCA61', regNo: '2538M0115', name: 'MUGILAN K' },
    { rollNo: '25MCA62', regNo: '2538M0116', name: 'MURUGAN R' },
    { rollNo: '25MCA63', regNo: '2538M0117', name: 'NANDHA DEVI R' },
    { rollNo: '25MCA64', regNo: '2538M0118', name: 'NANDHA KUMAR S' },
    { rollNo: '25MCA65', regNo: '2538M0119', name: 'NANDHANA M S' },
    { rollNo: '25MCA66', regNo: '2538M0120', name: 'NARESH KUMAR M' },
    { rollNo: '25MCA67', regNo: '2538M0121', name: 'NARTHANAVARSA R S' },
    { rollNo: '25MCA68', regNo: '2538M0123', name: 'NAVEEN KUMAR S' },
    { rollNo: '25MCA69', regNo: '2538M0122', name: 'NAVEEN C' },
    { rollNo: '25MCA70', regNo: '2538M0124', name: 'NAVEEN U P' },
    { rollNo: '25MCA71', regNo: '2538M0125', name: 'NITHIESH KUMAR V' },
    { rollNo: '25MCA72', regNo: '2538M0126', name: 'ODEYAR DIVYA BALASUBRAMANIYAM' },
    { rollNo: '25MCA73', regNo: '2538M0127', name: 'PAVITHRA K' },
    { rollNo: '25MCA74', regNo: '2538M0128', name: 'PAVITHRAN R' },
    { rollNo: '25MCA75', regNo: '2538M0129', name: 'POOJA LAKSHMI G' },
    { rollNo: '25MCA76', regNo: '2538M0130', name: 'POORNIMA M' },
    { rollNo: '25MCA77', regNo: '2538M0131', name: 'PRAVEEN M' },
    { rollNo: '25MCA78', regNo: '2538M0132', name: 'PREMKUMAR S' },
    { rollNo: '25MCA79', regNo: '2538M0133', name: 'PRINCY SILMYA G' },
    { rollNo: '25MCA80', regNo: '2538M0134', name: 'PRIYADHARSHINI V' },
    { rollNo: '25MCA81', regNo: '2538M0135', name: 'RAGUL B M' },
    { rollNo: '25MCA82', regNo: '2538M0136', name: 'RAJAN S' },
    { rollNo: '25MCA83', regNo: '2538M0137', name: 'RANJITHA G' },
    { rollNo: '25MCA84', regNo: '2538M0138', name: 'RATHIDEVI K' },
    { rollNo: '25MCA85', regNo: '2538M0139', name: 'RICHARD IMPRANCH M' },
    { rollNo: '25MCA86', regNo: '2538M0140', name: 'ROHINI S' },
    { rollNo: '25MCA87', regNo: '2538M0141', name: 'SAKTHIVEL C' },
    { rollNo: '25MCA88', regNo: '2538M0142', name: 'SANDHIYA Y' },
    { rollNo: '25MCA89', regNo: '2538M0143', name: 'SANGEETHA K' },
    { rollNo: '25MCA90', regNo: '2538M0144', name: 'SANJAY G' },
    { rollNo: '25MCA91', regNo: '2538M0145', name: 'SANJAY M' },
    { rollNo: '25MCA92', regNo: '2538M0146', name: 'SANJEEV M S' },
    { rollNo: '25MCA93', regNo: '2538M0147', name: 'SANTHOSH BOOPATHI K' },
    { rollNo: '25MCA94', regNo: '2538M0148', name: 'SARUN PRABHU V' },
    { rollNo: '25MCA95', regNo: '2538M0149', name: 'SASIDHARAN G R' },
    { rollNo: '25MCA96', regNo: '2538M0150', name: 'SAVITHA G' },
    { rollNo: '25MCA97', regNo: '2538M0151', name: 'SHANJAI M' },
    { rollNo: '25MCA98', regNo: '2538M0152', name: 'SHANJAY S D' },
    { rollNo: '25MCA99', regNo: '2538M0153', name: 'SHARMILADEVI K' },
    { rollNo: '25MCA100', regNo: '2538M0154', name: 'SHRI AKSHITH SIDDHARTH J' },
    { rollNo: '25MCA101', regNo: '2538M0155', name: 'SIGI SANTHOSH U' },
    { rollNo: '25MCA102', regNo: '2538M0156', name: 'SIRANJEEVI R' },
    { rollNo: '25MCA104', regNo: '2538M0157', name: 'SREEJISHNA K' },
    { rollNo: '25MCA105', regNo: '2538M0158', name: 'SRI VIGASHNI C S' },
    { rollNo: '25MCA106', regNo: '2538M0159', name: 'SUBASHINI B' },
    { rollNo: '25MCA107', regNo: '2538M0160', name: 'SUBRAMANIYABHARATHI V' },
    { rollNo: '25MCA108', regNo: '2538M0161', name: 'SUDHARSANA V' },
    { rollNo: '25MCA109', regNo: '2538M0162', name: 'SUNDAR P' },
    { rollNo: '25MCA110', regNo: '2538M0163', name: 'SURENDER VIGNESH M' },
    { rollNo: '25MCA111', regNo: '2538M0164', name: 'SURYA D' },
    { rollNo: '25MCA112', regNo: '2538M0165', name: 'TAMILMANI J' },
    { rollNo: '25MCA113', regNo: '2538M0166', name: 'THARUN RANGASAMY V' },
    { rollNo: '25MCA114', regNo: '2538M0167', name: 'THIRISHA P' },
    { rollNo: '25MCA115', regNo: '2538M0168', name: 'VAITHISWARAN N' },
    { rollNo: '25MCA116', regNo: '2538M0169', name: 'VENKATESAN R' },
    { rollNo: '25MCA117', regNo: '2538M0170', name: 'VENKATESHWARAN C' },
    { rollNo: '25MCA118', regNo: '2538M0171', name: 'VIGNESH B' },
    { rollNo: '25MCA119', regNo: '2538M0172', name: 'VIGNESH K M' },
    { rollNo: '25MCA120', regNo: '2538M0173', name: 'VIGNESH S' },
    { rollNo: '25MCA121', regNo: '2538M0174', name: 'VINOTHKUMAR K' },
    { rollNo: '25MCA122', regNo: '2538M0175', name: 'VISHNUPRIYA S' },
    { rollNo: '25MCA123', regNo: '2538M0176', name: 'XAVIER LEONARD E' },
    { rollNo: '25MCA124', regNo: '2538M0177', name: 'YESHWANTH S' }
  ].map(s => {
    let batchName = 'II MCA A';
    const num = parseInt(s.rollNo.replace('25MCA', ''), 10);
    if (num >= 1 && num <= 47) batchName = 'II MCA A';
    else if (num >= 48 && num <= 82) batchName = 'II MCA B';
    else if (num >= 83 && num <= 125) batchName = 'II MCA C';
    return { ...s, batchName };
  });

  console.log('Seeding students...');
  for (let i = 0; i < studentsData.length; i++) {
    const s = studentsData[i];
    const email = `${s.rollNo.toLowerCase()}@kgisliim.ac.in`;
    const batch = batches[s.batchName];
    const specificPasswordHash = await bcrypt.hash(s.rollNo, 10);

    await prisma.student.upsert({
      where: { rollNo: s.rollNo },
      update: { name: s.name, email: email, passwordHash: specificPasswordHash, batchId: batch.id },
      create: {
        name: s.name,
        rollNo: s.rollNo,
        email: email,
        passwordHash: specificPasswordHash,
        batchId: batch.id,
      },
    });
  }
  console.log(`Seeded ${studentsData.length} students successfully.`);

  // 3. Create Faculty
  const faculties = [
    { name: 'Dr. Yemunarane', email: 'yemunaranekumaravel@gmail.com' },
    { name: 'D Surendren', email: 'surendren@gmail.com' },
    { name: 'Gomathi R', email: 'gomathi@gmail.com' },
    { name: 'Saranya S', email: 'saranya@gmail.com' },
    { name: 'G Rajesh', email: 'rajesh@gmail.com' },
    { name: 'Technical Team', email: 'teachnicalteam@gmail.com' },
    { name: 'Aptitude Team', email: 'aptitudeteam@gmail.com' },
    { name: 'KP', email: 'kp@kgisliim.ac.in' },
    { name: 'MC', email: 'mc@kgisliim.ac.in' },
  ];

  for (const f of faculties) {
    await prisma.faculty.upsert({
      where: { email: f.email },
      update: { passwordHash },
      create: {
        name: f.name,
        email: f.email,
        passwordHash,
      },
    });
  }
  console.log(`Seeded ${faculties.length} faculty members.`);

  // 4. Create Subjects
  const subjectCodes = ['PHP', 'OSC', 'CC', 'NSC', 'AI,ML', 'OSC LAB', 'AI,ML LAB', 'PLAC', 'TECH'];
  for (const code of subjectCodes) {
    await prisma.subject.upsert({
      where: { code },
      update: {},
      create: {
        name: code,
        code: code
      }
    });
  }
  console.log(`Seeded ${subjectCodes.length} subjects.`);

  // 5. Create Room
  await prisma.room.upsert({
    where: { name: 'MCA Lab' },
    update: {
      latitude: 11.081679,
      longitude: 77.005543,
    },
    create: {
      name: 'MCA Lab',
      latitude: 11.081679,
      longitude: 77.005543,
      geofenceRadiusM: 10000,
      wifiBssidWhitelist: []
    }
  });

  console.log('Created MCA Lab.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
