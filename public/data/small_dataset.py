import argparse
import pandas as pd
import os

def parse_most_efficient(features_str: str) -> str:
    """
    Check the 'Features' text to see if it indicates
    'Most Efficient: No' vs. 'Most Efficient: Yes' vs. N/A.
    """
    if not isinstance(features_str, str):
        return "N/A"  # If Features is missing or not a string

    # Look specifically for "Most Efficient  : No" vs. "Most Efficient"
    # Some rows have 'Most Efficient  : No'
    # Some have 'Most Efficient  :' with no 'No'
    # Some might not have 'Most Efficient' at all.

    features_str_lower = features_str.lower()
    if "most efficient" in features_str_lower:
        # If we see "most efficient  : no", we call it "No"
        return "No" if ": no" in features_str_lower else "Yes"
    else:
        return "N/A"

def main():
    parser = argparse.ArgumentParser(
        description="Generate a small sample of the large CSV."
    )
    parser.add_argument(
        "--input",
        default=r"C:\Users\Owner\Documents\GitHub\energy-audit-store\public\data\products.csv",
        help="Path to the original (large) CSV file."
    )
    parser.add_argument(
        "--output",
        default="small_sample.csv",
        help="Path to save the smaller sample CSV. Default: small_sample.csv"
    )

    args = parser.parse_args()

    # 1. Read the original CSV
    df = pd.read_csv(args.input, dtype=str)  # Read everything as string, just to be safe

    # 2. Create a new column for 'Most_Efficient' by parsing the 'Features' column
    if "Features" not in df.columns:
        raise ValueError("The CSV must have a 'Features' column for this script to work.")

    df["Most_Efficient"] = df["Features"].apply(parse_most_efficient)

    # 3. Group by (Main Category, Sub-Category, Most_Efficient)
    #    and pick the first row in each group.
    required_columns = ["Main Category", "Sub-Category", "Most_Efficient"]
    for col in required_columns:
        if col not in df.columns:
            raise ValueError(f"The CSV must have a '{col}' column for this script to work.")

    grouped_df = df.groupby(["Main Category", "Sub-Category", "Most_Efficient"], as_index=False).first()

    # 4. Write to a new CSV
    grouped_df.to_csv(args.output, index=False)

    print(f"Small-sample CSV created successfully at {args.output}")
    # print the full path of the output file
    print(os.path.abspath(args.output))

if __name__ == "__main__":
    main()
