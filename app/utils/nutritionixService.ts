// src/app/utils/nutritionixService.ts

const APP_ID  = process.env.EXPO_PUBLIC_NUTRITIONIX_APP_ID!
const APP_KEY = process.env.EXPO_PUBLIC_NUTRITIONIX_API_KEY!

export interface Nutrition {
  name:            string
  calories:        number
  protein:         number
  carbs:           number
  fat:             number
  servingQty:      number        
  servingUnit:     string        
  servingWeight:   number        
}

interface NixFood {
  food_name:              string
  nf_calories:            number
  nf_protein:             number
  nf_total_carbohydrate:  number
  nf_total_fat:           number
  serving_qty:            number
  serving_unit:           string
  serving_weight_grams:   number
}

export async function fetchNutrition(query: string): Promise<Nutrition> {
  const res = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'x-app-id':      APP_ID,
      'x-app-key':     APP_KEY,
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Nutritionix error ${res.status}: ${err.message || res.statusText}`)
  }

  const data = await res.json()
  const foods: NixFood[] = data.foods
  if (!Array.isArray(foods) || foods.length === 0) {
    throw new Error('No nutrition data found')
  }

  const f = foods[0]
  return {
    name:          f.food_name,
    calories:      f.nf_calories,
    protein:       f.nf_protein,
    carbs:         f.nf_total_carbohydrate,
    fat:           f.nf_total_fat,
    servingQty:    f.serving_qty,
    servingUnit:   f.serving_unit,
    servingWeight: f.serving_weight_grams,
  }
}
