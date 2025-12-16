
import { ZombieDefense } from "../../src/utils/ZombieDefense";

async function main() {
    console.log("🧟 Zombie Process Detector (Wrapper)...\n");
    const report = await ZombieDefense.scan();

    if (report.ghosts.length > 0) {
        console.log("🚨 DETECTED GHOST PROCESSES:");
        report.ghosts.forEach(g => console.log(`   💀 ${g}`));
    }
    
    if (report.duplicates.length > 0) {
        console.log("⚠️  DETECTED DUPLICATES:");
        report.duplicates.forEach(d => console.log(`   👯 ${d}`));
    }

    if (report.unknowns.length > 0) {
         console.log("⚠️  DETECTED UNKNOWNS:");
         report.unknowns.forEach(u => console.log(`   👽 ${u}`));
    }

    console.log(`\n----------------------------------------`);
    if (report.clean) {
        console.log("✅ SYSTEM CLEAN. No Zombies detected.");
    } else {
        console.log("❌ ZOMBIES FOUND.");
        const targets = [...new Set([...ZombieDefense['extractPids'](report.ghosts), ...ZombieDefense['extractPids'](report.duplicates)])];
        
        if (targets.length > 0) {
             process.stdout.write(`\n👇 Found ${targets.length} confirmable zombies. Kill? [y/N] `);
             const answer = await new Promise<string>(resolve => process.stdin.once("data", d => resolve(d.toString().trim())));
             
             if (answer.toLowerCase() === 'y') {
                 await ZombieDefense.killZombies(report);
                 console.log("✅ Zombies killed.");
                 process.exit(0);
             }
        }
        
        console.log("   Run 'pkill -f bun' to clear.");
        process.exit(1);
    }
}

main();
