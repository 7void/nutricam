// app/utils/classifyFood.ts
import * as FileSystem from 'expo-file-system'

export interface ClarifaiConcept {
  id: string
  name: string
  value: number
}

export async function classifyWithClarifai(uri: string): Promise<ClarifaiConcept[]> {
  const KEY       = process.env.EXPO_PUBLIC_CLASSIFICATION_API_KEY
  const USER_ID   = 'clarifai'      
  const APP_ID    = 'main'          
  const MODEL_ID  = 'food-item-recognition'

  // Read image as Base64
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  const body = {
    user_app_id: { user_id: USER_ID, app_id: APP_ID },
    inputs: [
      { data: { image: { base64 } } }
    ]
  }

  // Hit the un‑versioned predict endpoint
  const res = await fetch(
    `https://api.clarifai.com/v2/models/${MODEL_ID}/outputs`,
    {
      method: 'POST',
      headers: {
        Authorization: `Key ${KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Clarifai API error ${res.status}: ${txt}`)
  }

  const json = await res.json()
  const concepts = json.outputs?.[0]?.data?.concepts
  if (!Array.isArray(concepts)) {
    throw new Error('No concepts returned from Clarifai')
  }

  return concepts.map((c: any) => ({
    id:    c.id,
    name:  c.name,
    value: c.value,
  }))
}
