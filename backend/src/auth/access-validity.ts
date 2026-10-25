export function isDateActive(date: Date | null | undefined) {
  if (!date) return false;
  return date.toISOString().slice(0, 10) >= new Date().toISOString().slice(0, 10);
}

export function getAccess(user: {
  isBureau: boolean;
  bureauValidUntil: Date | null;
  isIntervenant: boolean;
  intervenant?: { schoolEndDate: Date } | null;
}) {
  return {
    isBureau: user.isBureau && isDateActive(user.bureauValidUntil),
    isIntervenant: user.isIntervenant && isDateActive(user.intervenant?.schoolEndDate),
  };
}

export function getAccessError(user: {
  isBureau: boolean;
  bureauValidUntil: Date | null;
  isIntervenant: boolean;
  intervenant?: { schoolEndDate: Date } | null;
}, space: 'bureau' | 'intervenant') {
  if (space === 'bureau') {
    return user.isBureau
      ? 'Votre mandat au Bureau a expiré. Vous ne pouvez plus accéder à cet espace.'
      : "Ce compte ne dispose pas d'un accès à l'espace Bureau.";
  }
  return user.isIntervenant && user.intervenant
    ? 'Votre scolarité est terminée. Vous ne pouvez plus accéder à cet espace.'
    : "Ce compte ne dispose pas d'un accès à l'espace Intervenant.";
}
