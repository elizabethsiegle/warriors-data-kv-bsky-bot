const puppeteer = require('puppeteer');


const scrapeTeam = async team => {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const scrapeSeasonAndPlayers = async (year) => {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
      
      try {
        // First get player stats
        console.log(`Scraping ${team} ${year} player stats...`);
        await page.goto(`https://www.basketball-reference.com/teams/${team}/${year}.html`);
        await page.waitForSelector('#per_game_stats', { visible: true, timeout: 10000 });

        const playerStats = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('#per_game_stats tbody tr'))
            .filter(row => !row.classList.contains('thead'));
          
          return rows.map(row => {
            const getValue = (stat) => {
              let cell;
              switch(stat) {
                case "player":
                  cell = row.querySelector('[data-stat="name_display"]');
                  break;
                default:
                  cell = row.querySelector(`[data-stat="${stat}"]`);
              }
              return cell ? cell.textContent.trim() : null;
            };

            const parseNumeric = (value) => {
              if (!value) return null;
              const parsed = parseFloat(value);
              return isNaN(parsed) ? null : parsed;
            };

            return {
              name: getValue("player"),
              position: getValue("pos"),
              age: parseNumeric(getValue("age")),
              gamesPlayed: parseNumeric(getValue("games")),
              gamesStarted: parseNumeric(getValue("games_started")),
              minutesPerGame: parseNumeric(getValue("mp_per_g")),
              fieldGoalsPerGame: parseNumeric(getValue("fg_per_g")),
              fieldGoalAttempts: parseNumeric(getValue("fga_per_g")),
              fieldGoalPct: parseNumeric(getValue("fg_pct")),
              threePtPerGame: parseNumeric(getValue("fg3_per_g")),
              threePtAttempts: parseNumeric(getValue("fg3a_per_g")),
              threePtPct: parseNumeric(getValue("fg3_pct")),
              freeThrowsPerGame: parseNumeric(getValue("ft_per_g")),
              freeThrowAttempts: parseNumeric(getValue("fta_per_g")),
              freeThrowPct: parseNumeric(getValue("ft_pct")),
              reboundsPerGame: parseNumeric(getValue("trb_per_g")),
              assistsPerGame: parseNumeric(getValue("ast_per_g")),
              stealsPerGame: parseNumeric(getValue("stl_per_g")),
              blocksPerGame: parseNumeric(getValue("blk_per_g")),
              pointsPerGame: parseNumeric(getValue("pts_per_g"))
            };
          }).filter(player => player && player.name);
        });

        // Then get game data
        console.log(`Scraping ${team} ${year} game stats...`);
        await page.goto(`https://www.basketball-reference.com/teams/${team}/${year}/gamelog/`);
        await page.waitForSelector('#tgl_basic', { visible: true, timeout: 10000 });

        const gameStats = await page.evaluate(() => {
          let currentWins = 0;
          let currentLosses = 0;
          let currentStreak = { type: null, count: 0 };

          const rows = Array.from(document.querySelectorAll('#tgl_basic tbody tr'))
            .filter(row => !row.classList.contains('thead') && row.querySelector('[data-stat="date_game"]'));
          
          return rows.map(row => {
            const getValue = (stat) => {
              const cell = row.querySelector(`[data-stat="${stat}"]`);
              return cell ? cell.textContent.trim() : null;
            };

            const parseNumeric = (value) => {
              if (!value) return null;
              const parsed = parseFloat(value);
              return isNaN(parsed) ? null : parsed;
            };

            // Update wins/losses based on game result
            const result = getValue("game_result");
            if (result === 'W') {
              currentWins++;
              if (currentStreak.type === 'W') {
                currentStreak.count++;
              } else {
                currentStreak = { type: 'W', count: 1 };
              }
            } else if (result === 'L') {
              currentLosses++;
              if (currentStreak.type === 'L') {
                currentStreak.count++;
              } else {
                currentStreak = { type: 'L', count: 1 };
              }
            }

            // Calculate defensive rebounds
            const totalReb = parseNumeric(getValue("trb")) || 0;
            const offReb = parseNumeric(getValue("orb")) || 0;
            const defReb = totalReb - offReb;

            const oppTotalReb = parseNumeric(getValue("opp_trb")) || 0;
            const oppOffReb = parseNumeric(getValue("opp_orb")) || 0;
            const oppDefReb = oppTotalReb - oppOffReb;

            return {
              date: getValue("date_game"),
              homeGame: getValue("game_location") !== '@',
              opponent: getValue("opp_id"),
              result: result,
              teamPoints: parseNumeric(getValue("pts")),
              oppPoints: parseNumeric(getValue("opp_pts")),
              wins: currentWins,
              losses: currentLosses,
              streak: `${currentStreak.type} ${currentStreak.count}`,
              // Team stats
              teamFG: parseNumeric(getValue("fg")),
              teamFGA: parseNumeric(getValue("fga")),
              teamFGPct: parseNumeric(getValue("fg_pct")),
              team3P: parseNumeric(getValue("fg3")),
              team3PA: parseNumeric(getValue("fg3a")),
              team3PPct: parseNumeric(getValue("fg3_pct")),
              teamFT: parseNumeric(getValue("ft")),
              teamFTA: parseNumeric(getValue("fta")),
              teamFTPct: parseNumeric(getValue("ft_pct")),
              teamORB: parseNumeric(getValue("orb")),
              teamDRB: defReb || null,
              teamTRB: parseNumeric(getValue("trb")),
              teamAST: parseNumeric(getValue("ast")),
              teamSTL: parseNumeric(getValue("stl")),
              teamBLK: parseNumeric(getValue("blk")),
              teamTOV: parseNumeric(getValue("tov")),
              teamPF: parseNumeric(getValue("pf")),
              // Opponent stats
              oppFG: parseNumeric(getValue("opp_fg")),
              oppFGA: parseNumeric(getValue("opp_fga")),
              oppFGPct: parseNumeric(getValue("opp_fg_pct")),
              opp3P: parseNumeric(getValue("opp_fg3")),
              opp3PA: parseNumeric(getValue("opp_fg3a")),
              opp3PPct: parseNumeric(getValue("opp_fg3_pct")),
              oppFT: parseNumeric(getValue("opp_ft")),
              oppFTA: parseNumeric(getValue("opp_fta")),
              oppFTPct: parseNumeric(getValue("opp_ft_pct")),
              oppORB: parseNumeric(getValue("opp_orb")),
              oppDRB: oppDefReb || null,
              oppTRB: parseNumeric(getValue("opp_trb")),
              oppAST: parseNumeric(getValue("opp_ast")),
              oppSTL: parseNumeric(getValue("opp_stl")),
              oppBLK: parseNumeric(getValue("opp_blk")),
              oppTOV: parseNumeric(getValue("opp_tov")),
              oppPF: parseNumeric(getValue("opp_pf"))
            };
          });
        });

        // Debug: Log game stats
        console.log(`Found ${gameStats.length} games for ${year}`);
        if (gameStats.length > 0) {
          console.log('Sample game data:', gameStats[0]);
        }

        return {
          year,
          players: playerStats,
          games: gameStats
        };

      } catch (error) {
        console.error(`Error scraping ${year}:`, error);
        return { year, players: [], games: [] };
      } finally {
        await page.close();
      }
    };

    try {
      const seasons = {};
      // Scrape last 20 seasons
      for (let year = 2024; year > 2004; year--) {
        console.log(`Starting ${year} season...`);
        const seasonData = await scrapeSeasonAndPlayers(year);
        seasons[year] = seasonData;
        console.log(`Completed ${year} season: ${seasonData.players.length} players, ${seasonData.games.length} games`);
      }

      await fs.promises.mkdir('./basketball-data', { recursive: true });
      await fs.promises.writeFile(
        `./basketball-data/${team}.json`,
        JSON.stringify(seasons, null, 2)
      );
      
      console.log('Data saved successfully');
      
    } catch (e) {
      console.error('Scraping error:', e);
    } finally {
      await browser.close();
    }
};

// Run the scraper
(async () => {
  await scrapeTeam('GSW');
})();

module.exports = scrapeTeam;