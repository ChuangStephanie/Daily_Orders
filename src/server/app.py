from flask import Flask, request, jsonify, send_file
import os
import pandas as pd
import sys
from tqdm import tqdm
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

def main(df: pd.DataFrame, export: str = "output.xlsx") -> None:
    # import the file to a dataframe

    tqdm.pandas()

    # drop unessecary columns
    try:
        df = df.drop(
            columns=[
                "Problem",
                "Rusty on water draining motor",
                "Rusty on walking motor",
                "Rusty on Roller",
            ]
        )

    except:
        df = df.drop(columns=["Problem"])

    # start building the result df
    result_df = pd.DataFrame(
        columns=[
            "Repair Type",
            "Location",
            "Customer",
            "Date",
            "Responsible",
            "Model",
            "S/N",
            "Scrap Motor S/N",
            "Component",
            "Component Demand",
            "Component Qty",
            "From Location",
            "To Location",
            "Move Name",
            "Repair Line Type",
        ]
    )

    progress_bar = tqdm(df.iterrows(), total=len(df))

    for idx, row in progress_bar:
        result_df = get_components(row, result_df)

    result_df = result_df.rename(
        columns={
            "Component": "Parts / Product",
            "Component Demand": "Parts / Demand",
            "Component Qty": "Parts / Quantity",
            "From Location": "Parts / Source Location",
            "To Location": "Parts / Destination Location",
            "Repair Line Type": "Parts / Type",
            "S/N": "Machine SN",
            "Model": "Product to Repair",
            "Date": "Scheduled Date",
            "Responsible": "Repairer",
            "Scrap Motor S/N": "Parts / Internal Note",
        }
    )

    result_df["Procurement Group"] = result_df["Machine SN"].apply(
        lambda x: f"1215/REF/{x}"
    )
    result_df["Parts / Procurement Group"] = result_df["Procurement Group"]
    result_df["Parts / Source Document"] = result_df["Procurement Group"]
    result_df["Status"] = ["Repaired" for x in result_df.iterrows()]
    result_df["External ID"] = result_df["Procurement Group"]
    result_df["Scheduled Date"] = pd.to_datetime(result_df["Scheduled Date"])

    result_df.to_excel(export, index=False)


def get_components(row: pd.Series, df):
    for label in row.index:
        if (type(row[label]) not in [int, float]) or not (row[label] >= 0.0):
            continue

        # print(f"{label} : {row[label]}")

        new_row = {
            "Repair Type": "REF",
            "Location": "1215/Stock/WIP Handoff",
            "Customer": "Aiper",
            "Date": row["Date"],
            "Responsible": row["Responsible"],
            "Model": row["Model"],
            "S/N": row["S/N"],
            "Scrap Motor S/N": row["S/N"],
            "Component": label,
            "Component Demand": row[label],
            "Component Qty": row[label],
            "From Location": "1215/Stock/WIP Handoff",
            "To Location": "Virtual Locations/Production",
            "Move Name": f"{row['S/N']}_{label}_add",
            "Repair Line Type": "add",
        }

        scrap_row = {
            "Repair Type": "REF",
            "Location": "1215/Stock/WIP Handoff",
            "Customer": "Aiper",
            "Date": row["Date"],
            "Responsible": row["Responsible"],
            "Model": row["Model"],
            "S/N": row["S/N"],
            "Scrap Motor S/N": row["Scrap Motor S/N"],
            "Component": label,
            "Component Demand": row[label],
            "Component Qty": row[label],
            "From Location": "Virtual Locations/Production",
            "To Location": "Virtual Locations/Scrap",
            "Move Name": f"{row['S/N']}_{label}_remove",
            "Repair Line Type": "remove",
        }

        df = df._append(new_row, ignore_index=True)
        df = df._append(scrap_row, ignore_index=True)

    return df

@app.route('/', methods=['GET'])
def default():
    return {"message": "Hello"}

@app.route('/api/refurb-repair', methods=[ 'POST' ])
def process_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    try:
        df = pd.read_excel(file, header=2)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    output_dir = os.path.join("db", "processed")

    os.makedirs(output_dir, exist_ok=True)
    
    output_file = os.path.join(output_dir, "output.xlsx")
    main(df, output_file)

    return send_file(output_file, as_attachment=True, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

if __name__ == "__main__":
    app.run(debug=True, port=5000)
