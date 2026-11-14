// Deterministic study-metadata matching. No interpolation of unreported conditions.
export const COMPONENTS = ['Electrical panel', 'Ventilation system', 'Storage area', 'Interior wall panel'];
export const MATERIALS = ['PMMA', 'SIBAL fabric', 'Textile samples', 'Liquid fuel droplets', 'Unspecified'];
export const DEMOS = [
  { name: '01 · Fabric & forced flow', component: 'Storage area', material: 'SIBAL fabric', gravity: 'Microgravity', airflow: '20', oxygen: '' },
  { name: '02 · PMMA research gaps', component: 'Interior wall panel', material: 'PMMA', gravity: 'Microgravity', airflow: '', oxygen: '' },
  { name: '03 · Lunar extrapolation', component: 'Electrical panel', material: 'PMMA', gravity: 'Lunar gravity', airflow: '25', oxygen: '' },
];
export const known = value => value != null && !['', 'n/a', 'unknown', 'not reported', 'unspecified'].includes(String(value).trim().toLowerCase());
const condition = (label, requested, reported, matches) => ({
  label, requested: known(requested) ? String(requested) : 'Unspecified',
  reported: known(reported) ? String(reported) : 'Not reported',
  status: !known(requested) || !known(reported) ? 'Unknown' : matches ? 'Matched' : 'Different',
});

export function rankCoverage(experiments, evidence, scenario) {
  return experiments.map(study => {
    const text = `${study.fuel || ''} ${study.composition || ''}`.toLowerCase();
    const terms = { PMMA: ['pmma'], 'SIBAL fabric': ['sibal'], 'Textile samples': ['textile'], 'Liquid fuel droplets': ['liquid', 'droplet'] };
    const materialMatch = (terms[scenario.material] || []).some(term => text.includes(term));
    // Generic mixed-material metadata cannot establish a different material.
    const materialReported = materialMatch ? `${study.fuel}; ${study.composition}` :
      (!known(study.fuel) || study.fuel === 'Multiple materials' ? '' : study.fuel);
    const conditions = [
      condition('Component', scenario.component, '', false),
      condition('Material', scenario.material, materialReported, materialMatch),
      condition('Gravity', scenario.gravity, study.gravity, scenario.gravity === study.gravity),
      condition('Oxygen (%)', scenario.oxygen, study.oxygen_percent, Number(scenario.oxygen) === Number(study.oxygen_percent)),
      condition('Airflow (cm/s)', scenario.airflow, study.airflow_cm_s, Number(scenario.airflow) === Number(study.airflow_cm_s)),
    ];
    const records = evidence.filter(record => record.experiment_id === study.experiment_id);
    const matched = conditions.filter(c => c.status === 'Matched').length;
    return { ...study, conditions, records, matched, sufficient: conditions.every(c => c.status === 'Matched') && records.some(r => r.evidence_type === 'Observed Result') };
  }).sort((a, b) => b.matched - a.matched || a.experiment_id.localeCompare(b.experiment_id));
}
