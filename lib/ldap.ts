import ldap from 'ldapjs';

export async function authenticateLDAP(username: string, password: string): Promise<boolean> {
  const url = process.env.LDAP_URL || 'ldap://localhost:389';
  const bindDN = process.env.LDAP_BIND_DN;
  const bindPassword = process.env.LDAP_BIND_PASSWORD;
  const searchBase = process.env.LDAP_SEARCH_BASE || 'dc=example,dc=org';
  const searchFilter = (process.env.LDAP_SEARCH_FILTER || '(uid={{username}})').replace('{{username}}', username);

  return new Promise((resolve) => {
    const client = ldap.createClient({ url });

    const cleanup = () => {
      client.unbind();
      client.destroy();
    };

    const bindAndSearch = () => {
      // If bindDN is provided, bind first, then search for the user's DN
      if (bindDN && bindPassword) {
        client.bind(bindDN, bindPassword, (err) => {
          if (err) {
            cleanup();
            return resolve(false);
          }

          client.search(searchBase, { filter: searchFilter, scope: 'sub' }, (err, res) => {
            if (err) {
              cleanup();
              return resolve(false);
            }

            let userDN: string | null = null;
            res.on('searchEntry', (entry) => {
              userDN = entry.dn.toString();
            });

            res.on('error', () => {
              cleanup();
              resolve(false);
            });

            res.on('end', () => {
              if (userDN) {
                // Now bind with the user's DN and password
                const userClient = ldap.createClient({ url });
                userClient.bind(userDN, password, (err) => {
                  userClient.unbind();
                  userClient.destroy();
                  cleanup();
                  resolve(!err);
                });
              } else {
                cleanup();
                resolve(false);
              }
            });
          });
        });
      } else {
        // Direct bind if no search is needed (e.g., if the user DN can be constructed directly)
        // For simplicity, we assume we need to search for the DN first in most LDAP setups.
        // If the user DN is just cn={{username}},searchBase, we could try that too.
        client.bind(searchFilter, password, (err) => {
          cleanup();
          resolve(!err);
        });
      }
    };

    bindAndSearch();
  });
}
