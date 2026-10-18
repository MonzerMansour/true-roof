/** Who may delete a site.
 *
 * Its own tiny module so the rule is written once and tested, rather than
 * living as a condition in a page that somebody later copies wrongly. The
 * database enforces it too; this decides whether the control is even shown,
 * because offering a button that will be refused is its own kind of lie.
 */
export function canDeleteListing(viewer: {
  /** Director of the organization that owns the site. */
  isDirector: boolean
  /** The site belongs to another organization and was shared by code. */
  isShared: boolean
}): boolean {
  // A shared editor was invited to help keep one site current. Removing it is
  // not something an invitation grants, however senior they are elsewhere.
  if (viewer.isShared) return false
  return viewer.isDirector
}
