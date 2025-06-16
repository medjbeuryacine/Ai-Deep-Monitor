import sys

def main():
    args = sys.argv[1:]  # Ignorer le premier argument qui est le nom du script
    if not args:
        print("Aucun argument fourni.")
    else:
        print("Arguments reçus :")
        for i, arg in enumerate(args, start=1):
            print(f"Argument {i}: {arg}")

if __name__ == "__main__":
    main()