# CMU-Maps-Data-Visualization [Deprecated]

This repository is now deprecated. Please refer to the new repository: [ScottyLabs/cmumaps-data-visualization](https://github.com/ScottyLabs/cmumaps-data-visualization)

This project is inherently a client-side application, so we have moved away from Next.js to a more suitable architecture.

## To Run the Project

### First Time User

- Step 1: git clone
- Step 2: cd cmumaps-data-visualization
- Step 3: Get added to the [cmumaps-data](https://github.com/ScottyLabs/cmumaps-data/) repository.
- Step 4: git submodule add https\://github.com/ScottyLabs/cmumaps-data/ public/cmumaps-data
- Step 5: npm i
- Step 6a (optional): python3 -m venv .venv
- Step 6b (optional): source .venv/bin/activate
- Step 6c: pip3 install -r 'requirements.txt'
- Step 7: npm run dev

### Returning User

- Step 1: cd cmumaps-data-visualization
- Step 2: git submodule update --remote --merge
- Step 3: source .venv/bin/activate
  - _You should do this step iff you did the optional steps as a first time user._
- Step 4: npm run dev

### [Documentation Link](https://docs.google.com/document/d/1-cCIbMQp5eLcjvXO46XwQY86PnqABLn0Ts0VEIpT6AM/edit#heading=h.il1z64svzv6b)
