import subprocess

def snmpwalk_with_subprocess(ip: str, community: str, oid: str):
    """
    Exécute une commande SNMP walk en utilisant snmpwalk via subprocess.
    """
    cmd = ["snmpwalk", "-v2c", "-c", community, ip]
    if oid :
        cmd.append(oid)
    try:
        # Exécution de la commande
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        # Retourne les résultats sous forme de liste de lignes
        return result.stdout.strip().split("\n")
    except subprocess.CalledProcessError as e:
        # Gestion des erreurs
        raise Exception(f"Erreur lors de l'exécution de snmpwalk : {e.stderr.strip()}") from e


if __name__ == "__main__":
    ip = "192.168.1.169"  # Adresse IP cible
    community = "public"  # Communauté SNMP
    oid = ""  # OID à parcourir

    try:
        results = snmpwalk_with_subprocess(ip, community, oid)
        print("Résultats du SNMP Walk :")
        for line in results:
            print(line)
    except Exception as e:
        print(f"Erreur : {str(e)}")
