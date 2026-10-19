import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { Tenant } from './models/Tenant';
import { User } from './models/User';
import { Team } from './models/Team';
import { Player } from './models/Player';
import { Tournament } from './models/Tournament';
import { Match } from './models/Match';
import { MatchPayment } from './models/MatchPayment';
import { Expense } from './models/Expense';
import { Sponsor } from './models/Sponsor';

const sheetsDir = path.join(__dirname, 'sheets_data');

function parseCsv(filename: string): string[][] {
  const file = path.join(sheetsDir, filename);
  if (!fs.existsSync(file)) return [];
  const content = fs.readFileSync(file, 'utf8');
  return content
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      return line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    });
}

const seedAllTournamentsFromExcel = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting comprehensive multi-tournament import from Excel...');

    // Clean all collections
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Team.deleteMany({});
    await Player.deleteMany({});
    await Tournament.deleteMany({});
    await Match.deleteMany({});
    await MatchPayment.deleteMany({});
    await Expense.deleteMany({});
    await Sponsor.deleteMany({});

    // 1. Tenant
    const tenant = await Tenant.create({
      name: 'Gulzar Cricket Club',
      slug: 'gulzar-cc',
      isActive: true,
    });

    // 2. Super Admin User
    const admin = await User.create({
      tenantId: tenant._id,
      name: 'Faraz (Captain)',
      email: 'admin@captainsportal.com',
      password: 'admin123',
      phone: '0300-1234567',
      role: 'super_admin',
    });

    // 3. Teams
    const team1 = await Team.create({
      tenantId: tenant._id,
      captainId: admin._id,
      name: 'Gulzar Cricket Team',
      shortName: 'GCT',
      city: 'Karachi',
      primaryColor: '#0284c7',
      description: 'Main Squad - Catchy Classic & Champions League',
    });

    const team2 = await Team.create({
      tenantId: tenant._id,
      captainId: admin._id,
      name: 'Gulzar Night Warriors',
      shortName: 'GNW',
      city: 'Karachi',
      primaryColor: '#10b981',
      description: 'Floodlight Tape Ball Tournament Squad',
    });

    // 4. Parse Players from Kits Data
    const playerMap: { [key: string]: any } = {};
    const kitsRows = parseCsv('Kits_Data.csv');

    for (let i = 2; i < kitsRows.length; i++) {
      const row = kitsRows[i];
      const name = (row[1] || '').trim();
      if (!name || name.toLowerCase().includes('floppy')) continue;

      const num = parseInt(row[2]) || undefined;
      const sSize = row[3] || '';
      const tSize = row[4] || '';
      const code = row[5] || '';
      const kitPaid = parseFloat(row[7]) || 0;

      const playerDoc = await Player.create({
        tenantId: tenant._id,
        teamIds: [team1._id, team2._id],
        name,
        role: 'all_rounder',
        battingStyle: 'right_hand',
        bowlingStyle: 'right_arm_medium',
        jerseyNumber: num,
        notes: `Code: ${code} | Shirt: ${sSize} | Trouser: ${tSize} | Kit Paid: Rs ${kitPaid}`,
        isRegular: true,
      });

      playerMap[name.toLowerCase()] = playerDoc;
    }

    // Extra players from other tournament sheets
    const extraNames = ['Rauf', 'Osman', 'Hamza Spinest', 'Mehekri', 'Mubi', 'Taha', 'Farhat', 'Fawad', 'Marchant'];
    for (const en of extraNames) {
      if (!playerMap[en.toLowerCase()]) {
        const pDoc = await Player.create({
          tenantId: tenant._id,
          teamIds: [team1._id, team2._id],
          name: en,
          role: 'all_rounder',
          battingStyle: 'right_hand',
          bowlingStyle: 'right_arm_medium',
          isRegular: true,
        });
        playerMap[en.toLowerCase()] = pDoc;
      }
    }

    console.log(`✅ Registered ${Object.keys(playerMap).length} Unique Players from Excel`);

    const getP = (name: string) => {
      if (!name) return null;
      const lower = name.toLowerCase().trim();
      if (playerMap[lower]) return playerMap[lower];

      const clean = lower.replace(/kp|spinest|\(z\. alvi\)|subah topi|subah gayab/g, '').trim();
      if (!clean) return null;
      if (playerMap[clean]) return playerMap[clean];

      for (const k of Object.keys(playerMap)) {
        if (k === clean || k.startsWith(clean) || clean.startsWith(k)) return playerMap[k];
      }
      return null;
    };

    // 5. Sponsors (from Other League)
    await Sponsor.create([
      {
        tenantId: tenant._id,
        teamId: team1._id,
        sponsorName: 'SipNest Management',
        companyName: 'SipNest',
        amountInvested: 70000,
        investmentDate: new Date('2026-02-15'),
        contractType: 'jersey_front',
        status: 'active',
        notes: 'Title / Front Chest Sponsor',
      },
      {
        tenantId: tenant._id,
        teamId: team1._id,
        sponsorName: 'Principal / Admin',
        companyName: 'New Era School',
        amountInvested: 30000,
        investmentDate: new Date('2026-03-01'),
        contractType: 'jersey_back',
        status: 'active',
        notes: 'Back Logo & Education Partner',
      },
      {
        tenantId: tenant._id,
        teamId: team1._id,
        sponsorName: 'Management',
        companyName: 'CBM Computers',
        amountInvested: 26000,
        investmentDate: new Date('2026-03-10'),
        contractType: 'sleeve',
        status: 'active',
        notes: 'Sleeve Branding',
      },
      {
        tenantId: tenant._id,
        teamId: team1._id,
        sponsorName: 'Director Ahmed',
        companyName: 'Ahmed Ascend Academy',
        amountInvested: 10000,
        investmentDate: new Date('2026-04-05'),
        contractType: 'tournament_banner',
        status: 'active',
        notes: 'Match Day Partner',
      },
    ]);
    console.log('✅ Created Sponsors (Total: Rs 136,000)');

    // 6. Expenses (from Other League & Kits)
    await Expense.create([
      {
        tenantId: tenant._id,
        teamId: team1._id,
        category: 'kit_jerseys',
        title: 'Team Kits Manufacturing (23 Players)',
        amount: 77000,
        expenseDate: new Date('2026-05-15'),
        paidBy: 'Captain Faraz',
        description: 'Complete customized shirts, trousers & floppies (Recovered from players: Rs 73,450)',
      },
      {
        tenantId: tenant._id,
        teamId: team1._id,
        category: 'equipment',
        title: 'Caps & Floppies for Squad',
        amount: 6000,
        expenseDate: new Date('2026-05-20'),
        paidBy: 'Team Fund',
        description: 'Team caps and floppies for sunny matches',
      },
      {
        tenantId: tenant._id,
        teamId: team1._id,
        category: 'other',
        title: 'Marketing & Digital Match Graphics',
        amount: 3000,
        expenseDate: new Date('2026-06-01'),
        paidBy: 'Captain Faraz',
      },
    ]);

    // 7. Tournament Configs with financial definitions from Other League
    const tournamentConfigs = [
      {
        name: 'Catchy Classic 24',
        csvFile: 'Catchy_Classic_24.csv',
        entryFee: 53800,
        expectedWinningPrize: 145000,
        actualWinningPrizeWon: 145000,
        status: 'completed',
        momPrize: 4500,
        format: 'Hard Ball',
        notes: 'Paid Rs 134,000 | Total Payable Rs 145,000 | MOM Rs 4,500',
      },
      {
        name: 'Catchy Classic 20',
        csvFile: 'Catchy_Classic_20.csv',
        entryFee: 29000,
        expectedWinningPrize: 135000,
        actualWinningPrizeWon: 36500,
        status: 'completed',
        momPrize: 5500,
        format: 'Hard Ball',
        notes: 'Won Winning Amount Rs 36,500 | Paid Rs 129,500 | MOM Rs 5,500',
      },
      {
        name: 'Catchy Classic 22',
        csvFile: 'Catchy_Classic_22.csv',
        entryFee: 28250,
        expectedWinningPrize: 135000,
        actualWinningPrizeWon: 33000,
        status: 'completed',
        momPrize: 5000,
        format: 'Hard Ball',
        notes: 'Winning Amount Rs 33,000 | Paid Rs 97,100 | MOM Rs 5,000 | Compensation Rs 9,500',
      },
      {
        name: 'Catchy Classic 23',
        csvFile: 'Catchy_Classic_23.csv',
        entryFee: 1300,
        expectedWinningPrize: 135000,
        actualWinningPrizeWon: 0,
        status: 'completed',
        momPrize: 3500,
        format: 'Hard Ball',
        notes: 'Paid Rs 58,400 | Payable Rs 135,000 | MOM Rs 3,500 | Compensation Rs 12,500',
      },
      {
        name: 'Champions League 8',
        csvFile: 'Champions_League_8.csv',
        entryFee: 97200,
        expectedWinningPrize: 190000,
        actualWinningPrizeWon: 0,
        status: 'completed',
        momPrize: 0,
        format: 'Hard Ball',
        notes: 'Paid Rs 127,200 | Total Payable Rs 190,000',
      },
      {
        name: 'Catchy Classic 25',
        csvFile: 'Catchy_Classic_25.csv',
        entryFee: 4700,
        expectedWinningPrize: 145000,
        actualWinningPrizeWon: 0,
        status: 'ongoing',
        momPrize: 500,
        format: 'Hard Ball',
        notes: 'Paid Rs 11,000 | Total Payable Rs 145,000 | MOM Rs 500',
      },
      {
        name: 'All Star League',
        csvFile: null,
        entryFee: 38900,
        expectedWinningPrize: 175000,
        actualWinningPrizeWon: 0,
        status: 'completed',
        momPrize: 4000,
        format: 'T20',
        notes: 'Paid Rs 171,000 | Total Payable Rs 175,000 | MOM Rs 4,000',
      },
    ];

    let totalMatchesCreated = 0;
    let totalPaymentsCreated = 0;

    for (const tCfg of tournamentConfigs) {
      console.log(`\n⏳ Processing Tournament: ${tCfg.name}...`);

      const tournamentDoc = await Tournament.create({
        tenantId: tenant._id,
        teamId: team1._id,
        name: tCfg.name,
        format: tCfg.format as any,
        startDate: new Date('2026-01-01'),
        entryFee: tCfg.entryFee,
        expectedWinningPrize: tCfg.expectedWinningPrize,
        actualWinningPrizeWon: tCfg.actualWinningPrizeWon,
        status: tCfg.status as any,
        notes: tCfg.notes,
      });

      if (!tCfg.csvFile) continue;

      const rows = parseCsv(tCfg.csvFile);
      if (rows.length < 5) continue;

      // Find header row containing "Name"
      let nameRowIdx = -1;
      for (let r = 0; r < 6 && r < rows.length; r++) {
        const found = rows[r].findIndex((c) => c.toLowerCase() === 'name');
        if (found !== -1) {
          nameRowIdx = r;
          break;
        }
      }

      if (nameRowIdx === -1) {
        console.warn(`Could not find header row in ${tCfg.csvFile}`);
        continue;
      }

      const headerRow = rows[nameRowIdx];
      const nameColIdx = headerRow.findIndex((c) => c.toLowerCase() === 'name');
      const startMatchColIdx = nameColIdx + 2;

      const venueRow = rows[0] || [];
      const refreshRow = nameRowIdx >= 2 ? rows[nameRowIdx - 2] : [];
      const costRow = nameRowIdx >= 1 ? rows[nameRowIdx - 1] : [];

      // Extract match columns
      const matchColumns: { colIdx: number; title: string; venue: string; groundCost: number; refreshCost: number; stage: string }[] = [];

      for (let c = startMatchColIdx; c < headerRow.length; c++) {
        const colHeader = headerRow[c] || '';
        const venueInfo = (venueRow[c] || '').trim();
        const costVal = parseFloat((costRow[c] || '').replace(/[^0-9.-]/g, '')) || 0;
        const refVal = parseFloat((refreshRow[c] || '').replace(/[^0-9.-]/g, '')) || 0;

        const isMatch =
          colHeader.toLowerCase().includes('match') ||
          colHeader.toLowerCase().includes('final') ||
          colHeader.toLowerCase().includes('quarter') ||
          venueInfo.length > 0 ||
          costVal > 0;

        if (isMatch) {
          let stage = 'group';
          const combined = (colHeader + ' ' + venueInfo).toLowerCase();
          if (combined.includes('quarter')) stage = 'quarter_final';
          else if (combined.includes('semi')) stage = 'semi_final';
          else if (combined.includes('final')) stage = 'final';

          const displayVenue = venueInfo.length > 0 ? venueInfo : colHeader.length > 0 ? colHeader : `Match ${c - startMatchColIdx + 1}`;

          matchColumns.push({
            colIdx: c,
            title: colHeader || `Match ${c - startMatchColIdx + 1}`,
            venue: displayVenue,
            groundCost: costVal,
            refreshCost: refVal,
            stage,
          });
        }
      }

      console.log(`  Found ${matchColumns.length} match columns in ${tCfg.name}`);

      for (let mIdx = 0; mIdx < matchColumns.length; mIdx++) {
        const mCol = matchColumns[mIdx];
        const squadIds: mongoose.Types.ObjectId[] = [];
        const playerPayments: { pDoc: any; feePaid: number }[] = [];

        for (let r = nameRowIdx + 1; r < rows.length; r++) {
          const pRow = rows[r];
          const playerName = (pRow[nameColIdx] || '').trim();
          if (
            !playerName ||
            playerName.toLowerCase().includes('total') ||
            playerName.toLowerCase().includes('winning') ||
            playerName.toLowerCase().includes('extra')
          ) {
            continue;
          }

          const feePaidStr = (pRow[mCol.colIdx] || '').replace(/[^0-9.-]/g, '');
          const feePaid = parseFloat(feePaidStr) || 0;

          if (feePaid > 0) {
            const pDoc = getP(playerName);
            if (pDoc) {
              const existingIdx = playerPayments.findIndex(
                (x) => x.pDoc._id.toString() === pDoc._id.toString()
              );
              if (existingIdx !== -1) {
                playerPayments[existingIdx].feePaid += feePaid;
              } else {
                if (!squadIds.includes(pDoc._id)) squadIds.push(pDoc._id);
                playerPayments.push({ pDoc, feePaid });
              }
            }
          }
        }

        const totalCost = mCol.groundCost + mCol.refreshCost;
        const perPlayer = squadIds.length > 0 ? Math.ceil(totalCost / squadIds.length) : 1000;

        const matchDoc = await Match.create({
          tenantId: tenant._id,
          teamId: team1._id,
          matchType: 'tournament',
          tournamentId: tournamentDoc._id,
          tournamentStage: mCol.stage as any,
          matchDate: new Date(Date.now() - (matchColumns.length - mIdx) * 7 * 24 * 3600 * 1000),
          opponentTeam: `Opponent XI (${mCol.venue})`,
          venue: mCol.venue,
          overs: 20,
          groundCost: mCol.groundCost,
          refreshmentCost: mCol.refreshCost,
          totalMatchExpense: totalCost,
          perPlayerFee: perPlayer,
          squadPlayerIds: squadIds,
          result: mCol.stage === 'final' ? 'won' : 'won',
          notes: `${tCfg.name} - ${mCol.title} (${mCol.venue})`,
        });

        totalMatchesCreated++;

        for (const pp of playerPayments) {
          await MatchPayment.create({
            tenantId: tenant._id,
            teamId: team1._id,
            matchId: matchDoc._id,
            playerId: pp.pDoc._id,
            feeAssigned: pp.feePaid,
            feePaid: pp.feePaid,
            paymentStatus: 'paid',
            paymentMethod: 'cash',
            paymentDate: matchDoc.matchDate,
            notes: `${tCfg.name} - ${mCol.title}`,
          });
          totalPaymentsCreated++;
        }
      }
    }

    console.log(`\n🎉 Comprehensive Multi-Tournament Seed Complete!`);
    console.log(`✅ Total Tournaments: ${tournamentConfigs.length}`);
    console.log(`✅ Total Matches Created: ${totalMatchesCreated}`);
    console.log(`✅ Total Player Payments Recorded: ${totalPaymentsCreated}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during comprehensive seed:', error);
    process.exit(1);
  }
};

seedAllTournamentsFromExcel();
