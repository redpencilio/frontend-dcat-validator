export function friendlyError(
  err,
  defaultMessage = 'Something went wrong. Please try again.',
) {
  const status = err?.status ?? err?.response?.status;
  if (status >= 500) {
    return 'Something went wrong on our side. Please try again in a moment.';
  }
  if (status === 404) {
    return 'This resource could not be found.';
  }

  const jsonApiErrors = err?.content?.errors || err?.errors;
  if (Array.isArray(jsonApiErrors) && jsonApiErrors[0]) {
    return jsonApiErrors[0].detail || jsonApiErrors[0].title || defaultMessage;
  }

  return err?.message || defaultMessage;
}
