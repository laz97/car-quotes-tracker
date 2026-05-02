import supabase from './supabase'

export async function saveCarQuote(data) {
  const { data: row, error } = await supabase
    .from('car_quotes')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function getCarQuotes() {
  const { data, error } = await supabase
    .from('car_quotes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function saveLendingQuote(data) {
  const { data: row, error } = await supabase
    .from('lending_quotes')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function getLendingQuotesForCar(carQuoteId) {
  const { data, error } = await supabase
    .from('lending_quotes')
    .select('*')
    .eq('car_quote_id', carQuoteId)
  if (error) throw error
  return data
}

export async function updateCarQuote(id, data) {
  const { data: row, error } = await supabase
    .from('car_quotes')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function updateLendingQuote(id, data) {
  const { data: row, error } = await supabase
    .from('lending_quotes')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function deleteCarQuote(id) {
  const { error } = await supabase
    .from('car_quotes')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteLendingQuote(id) {
  const { error } = await supabase
    .from('lending_quotes')
    .delete()
    .eq('id', id)
  if (error) throw error
}
