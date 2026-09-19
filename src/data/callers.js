/* Trusted caller contexts, as the Fabric side of the protocol shapes them.
   `request_id` is intentionally absent here — Fabric binds a caller context to
   one request at derivation time, it is never a caller's standing property. */

export const CALLERS = Object.freeze({
  'svc.lead-intake': Object.freeze({
    schema_version: '2.0',
    caller_id: 'svc.lead-intake',
    granted_scopes: Object.freeze(['crm.contact.write', 'crm.contact.read', 'notify.email.send']),
    maximum_authority: 'L2',
  }),
  'svc.marketing-sync': Object.freeze({
    schema_version: '2.0',
    caller_id: 'svc.marketing-sync',
    granted_scopes: Object.freeze(['crm.contact.read', 'notify.email.send']),
    maximum_authority: 'L2',
  }),
  'svc.sandbox': Object.freeze({
    schema_version: '2.0',
    caller_id: 'svc.sandbox',
    granted_scopes: Object.freeze(['crm.contact.write']),
    maximum_authority: 'L1',
  }),
});

export const CALLER_IDS = Object.freeze(Object.keys(CALLERS));
