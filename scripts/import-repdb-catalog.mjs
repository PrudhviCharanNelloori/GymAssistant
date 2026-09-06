/**
 * Build a curated RepDB subset for GymTracker (in-app use + attribution required).
 *
 * Usage:
 *   curl -L -o scripts/_repdb_exercises.json https://raw.githubusercontent.com/RepDB/exercise-dataset/main/exercises.json
 *   node scripts/import-repdb-catalog.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const rawPath = path.join(__dirname, '_repdb_exercises.json');
const outJson = path.join(root, 'src', 'app', 'core', 'data', 'exercises-catalog.json');
const imageDir = path.join(root, 'public', 'assets', 'exercises');
const RAW_BASE = 'https://raw.githubusercontent.com/RepDB/exercise-dataset/main/';

/** Famous / widely used gym staples only (RepDB ids). */
const CURATED_IDS = [
  // Chest
  'bench-press',
  'incline-db-press',
  'incline-bench-press',
  'cable-fly',
  'push-up',
  'dips',
  'db-bench-press',
  // Back
  'deadlift',
  'barbell-row',
  'lat-pulldown',
  'pull-up',
  'seated-cable-row',
  'straight-arm-pulldown',
  'bent-over-db-row',
  // Shoulders
  'ohp',
  'dumbbell-shoulder-press',
  'lateral-raise',
  'face-pull',
  'rear-delt-fly',
  // Arms
  'barbell-curl',
  'hammer-curl',
  'incline-db-curl',
  'tricep-pushdown',
  'ez-bar-lying-tricep-extension',
  'close-grip-bench-press',
  // Legs
  'squat',
  'front-squat',
  'leg-press',
  'walking-lunge',
  'bulgarian-split-squat',
  'romanian-deadlift',
  'leg-curl',
  'leg-extension',
  'hip-thrust',
  'standing-calf-raise',
  // Core / full / cardio
  'plank',
  'hanging-knee-raise',
  'cable-crunch',
  'bicycle-crunch',
  'dumbbell-farmers-walk',
  'kettlebell-swing',
  'burpees',
  'jump-rope',
  'rowing-machine',
  'bodyweight-squat',
];

const MUSCLE_MAP = {
  pectoralis_major: 'CHEST',
  latissimus_dorsi: 'BACK',
  trapezius: 'BACK',
  rhomboids: 'BACK',
  erector_spinae: 'BACK',
  anterior_deltoid: 'SHOULDERS',
  lateral_deltoid: 'SHOULDERS',
  posterior_deltoid: 'SHOULDERS',
  supraspinatus: 'SHOULDERS',
  biceps_brachii: 'BICEPS',
  brachialis: 'BICEPS',
  triceps_brachii: 'TRICEPS',
  brachioradialis: 'FOREARMS',
  forearm_flexors: 'FOREARMS',
  forearm_extensors: 'FOREARMS',
  forearms: 'FOREARMS',
  rectus_abdominis: 'CORE',
  transverse_abdominis: 'CORE',
  obliques: 'CORE',
  serratus_anterior: 'CORE',
  quadratus_lumborum: 'CORE',
  hip_flexors: 'CORE',
  quadriceps: 'QUADS',
  adductors: 'QUADS',
  hamstrings: 'HAMSTRINGS',
  gluteus_maximus: 'GLUTES',
  gluteus_medius: 'GLUTES',
  abductors: 'GLUTES',
  gastrocnemius: 'CALVES',
  soleus: 'CALVES',
};

const BODY_PART_MAP = {
  chest: 'CHEST',
  back: 'BACK',
  shoulders: 'SHOULDERS',
  upper_arms: 'BICEPS',
  lower_arms: 'FOREARMS',
  core: 'CORE',
  upper_legs: 'QUADS',
  lower_legs: 'CALVES',
  full_body: 'FULL_BODY',
};

const EQUIPMENT_MAP = {
  barbell: 'BARBELL',
  ez_bar: 'BARBELL',
  trap_bar: 'BARBELL',
  dumbbell: 'DUMBBELL',
  cable: 'CABLE',
  kettlebell: 'KETTLEBELL',
  loop_band: 'BAND',
  resistance_band: 'BAND',
  lat_pulldown_machine: 'MACHINE',
  leg_press: 'MACHINE',
  leg_curl: 'MACHINE',
  leg_extension: 'MACHINE',
  chest_fly_machine: 'MACHINE',
  chest_press_machine: 'MACHINE',
  shoulder_press_machine: 'MACHINE',
  smith_machine: 'MACHINE',
  hack_squat: 'MACHINE',
  hip_thrust_machine: 'MACHINE',
  standing_calf_raise_machine: 'MACHINE',
  seated_calf_raise_machine: 'MACHINE',
  assisted_pullup_machine: 'MACHINE',
  dip_machine: 'MACHINE',
  rower: 'MACHINE',
  ab_crunch_machine: 'MACHINE',
  tricep_extension_machine: 'MACHINE',
  pull_up_bar: 'BODYWEIGHT',
  dip_station: 'BODYWEIGHT',
  flat_bench: 'OTHER',
  jump_rope: 'OTHER',
  plates: 'OTHER',
  ab_wheel: 'OTHER',
};

function mapMuscles(list = []) {
  return [...new Set(list.map((m) => MUSCLE_MAP[m]).filter(Boolean))];
}

function mapEquipment(value, isBodyweight) {
  if (!value) return isBodyweight ? ['BODYWEIGHT'] : ['OTHER'];
  return [EQUIPMENT_MAP[value] ?? (isBodyweight ? 'BODYWEIGHT' : 'OTHER')];
}

function trackingFor(primary, equipment) {
  if (primary === 'CARDIO') return ['DURATION'];
  if (equipment.includes('BODYWEIGHT') && !equipment.includes('BARBELL') && !equipment.includes('DUMBBELL')) {
    return ['REPS'];
  }
  if (['plank', 'jump-rope', 'rowing-machine', 'dumbbell-farmers-walk'].includes(arguments[2])) {
    // handled below via id
  }
  return ['WEIGHT', 'REPS'];
}

function pickImage(images) {
  const flat = images?.flat ?? {};
  return flat.peak || flat.main || flat.start || null;
}

function localImageName(repoPath) {
  return path.basename(repoPath);
}

async function download(repoPath, destFile) {
  if (fs.existsSync(destFile)) return;
  const url = RAW_BASE + repoPath.replace(/^\//, '');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destFile, buf);
}

if (!fs.existsSync(rawPath)) {
  console.error('Missing scripts/_repdb_exercises.json');
  process.exit(1);
}

fs.mkdirSync(imageDir, { recursive: true });
const data = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
const byId = new Map(data.exercises.map((e) => [e.id, e]));

const catalog = [];
const missing = [];

for (const id of CURATED_IDS) {
  const row = byId.get(id);
  if (!row) {
    missing.push(id);
    continue;
  }

  const primaryList = mapMuscles(row.primary_muscles);
  let primary = BODY_PART_MAP[row.body_part] ?? primaryList[0] ?? 'FULL_BODY';
  // Prefer a primary muscle that matches the body region when available
  if (primaryList.length) {
    const regionMatches = {
      CHEST: ['CHEST'],
      BACK: ['BACK'],
      SHOULDERS: ['SHOULDERS'],
      QUADS: ['QUADS', 'GLUTES', 'HAMSTRINGS'],
      CALVES: ['CALVES'],
      CORE: ['CORE'],
      BICEPS: ['BICEPS', 'TRICEPS'],
      FOREARMS: ['FOREARMS'],
      FULL_BODY: primaryList,
    };
    const allowed = regionMatches[primary] ?? primaryList;
    const preferred = primaryList.find((m) => allowed.includes(m));
    if (preferred) primary = preferred;
  }
  // Squats / leg press: quads as primary when listed
  if (['squat', 'front-squat', 'leg-press', 'leg-extension', 'walking-lunge', 'bulgarian-split-squat', 'bodyweight-squat'].includes(id)) {
    if (primaryList.includes('QUADS')) primary = 'QUADS';
  }
  if (['romanian-deadlift', 'leg-curl'].includes(id) && primaryList.includes('HAMSTRINGS')) {
    primary = 'HAMSTRINGS';
  }
  if (['hip-thrust'].includes(id) && primaryList.includes('GLUTES')) {
    primary = 'GLUTES';
  }
  if (row.category === 'cardio' || id === 'jump-rope' || id === 'rowing-machine' || id === 'burpees') {
    if (id === 'burpees') primary = 'FULL_BODY';
    else if (id === 'jump-rope' || id === 'rowing-machine') primary = 'CARDIO';
  }

  const secondary = mapMuscles(row.secondary_muscles).filter((m) => m !== primary);
  const equipment = mapEquipment(row.equipment, row.is_bodyweight);

  let metrics = trackingFor(primary, equipment);
  if (id === 'plank' || id === 'jump-rope' || id === 'rowing-machine' || id === 'dumbbell-farmers-walk') {
    metrics = id === 'dumbbell-farmers-walk' ? ['WEIGHT', 'DURATION'] : ['DURATION'];
  }
  if (id === 'push-up' || id === 'pull-up' || id === 'dips' || id === 'burpees' || id === 'bodyweight-squat') {
    metrics = ['REPS'];
  }

  const repoImage = pickImage(row.images);
  if (!repoImage) {
    missing.push(`${id}:no-image`);
    continue;
  }
  const fileName = localImageName(repoImage);
  const dest = path.join(imageDir, fileName);
  await download(repoImage, dest);

  // Also grab start pose when available (optional second frame)
  let imageStartUrl;
  if (row.images?.flat?.start) {
    const startName = localImageName(row.images.flat.start);
    await download(row.images.flat.start, path.join(imageDir, startName));
    imageStartUrl = `/assets/exercises/${startName}`;
  }

  catalog.push({
    id: `repdb-${row.id}`,
    name: row.name_en,
    primaryMuscleGroup: primary,
    secondaryMuscleGroups: secondary,
    equipment,
    trackingMetrics: metrics,
    instructions: row.instructions_en ?? [],
    description: row.description_en || undefined,
    imageUrl: `/assets/exercises/${fileName}`,
    imageStartUrl,
    source: 'repdb',
  });
}

catalog.sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync(outJson, JSON.stringify(catalog, null, 2));
console.log(`Wrote ${catalog.length} exercises → ${path.relative(root, outJson)}`);
console.log(`Images in ${path.relative(root, imageDir)}`);
if (missing.length) console.warn('Missing:', missing.join(', '));
