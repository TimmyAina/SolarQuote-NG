/**
 * Simple Icons slug candidates per catalog brand.
 *
 * Simple Icons uses kebab-case slugs that rarely match the catalog name exactly
 * ("Hewlett Packard Enterprise" -> "hewlettpackardenterprise"), so each brand
 * lists the slugs worth trying, most likely first.
 *
 * A brand absent from this map is probed with its own slugified name.
 */
export const CANDIDATE_SLUGS = {
  Apple: ['apple'],
  Dell: ['dell'],
  HP: ['hp'],
  HPE: ['hewlettpackardenterprise'],
  Lenovo: ['lenovo'],
  Acer: ['acer'],
  Asus: ['asus'],
  Tesla: ['tesla'],
};

export default CANDIDATE_SLUGS;
