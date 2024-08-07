#!/bin/sh

echo "Combining all data/*.ttl files into one file..."

data_file="data.nt"

# Clear the data file initially
> "$data_file"

# Change directory to "data"
cd data

# Find all *.ttl files in the current directory and one level of subdirectories
find . -maxdepth 2 -type f -name '*.ttl' | while read -r file; do
    # Call riot for each .ttl file and append the output to data.nt
    riot --out=ntriples "$file" >> "../$data_file"
done

# Return to the original directory
cd ..

# Run validation on combined data.nt file
echo "Validating data..."
riot --validate data.nt

# Check the return code
if [ $? -eq 0 ]; then
    # No errors found
    echo "No errors found"
else
    # Errors found, exit with non-zero status
    echo "Validation failed with errors"
    exit 1
fi

echo "Performing reasoning..."

# Run Eye reasoner with data and rules files
eye --nope --quiet --pass rules/*.n3 --turtle data.nt > result.ttl

# Check if reasoning was successful
if [ $? -eq 0 ]; then
    # Reasoning successful
    echo "Reasoning completed without errors. Result saved to result.ttl"
else
    # Reasoning failed
    echo "Reasoning failed with errors"
    exit 1
fi


# Run validation on the result file
echo "Validating result..."
riot --validate result.ttl
if [ $? -eq 0 ]; then
  echo "No errors found"
else
  echo "Validation failed with errors"
  exit 1
fi
