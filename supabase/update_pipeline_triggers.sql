-- Postgres trigger to automatically transition contact pipeline_status based on estimate status updates.
CREATE OR REPLACE FUNCTION public.update_contact_pipeline_on_estimate_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sent' THEN
    UPDATE public.contacts
    SET pipeline_status = 'estimate_sent',
        updated_at = NOW()
    WHERE id = NEW.contact_id AND pipeline_status != 'closed_won';
  ELSIF NEW.status IN ('approved', 'accepted') THEN
    UPDATE public.contacts
    SET pipeline_status = 'closed_won',
        updated_at = NOW()
    WHERE id = NEW.contact_id;
  ELSIF NEW.status IN ('rejected', 'expired') THEN
    UPDATE public.contacts
    SET pipeline_status = 'closed_lost',
        updated_at = NOW()
    WHERE id = NEW.contact_id AND pipeline_status != 'closed_won';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_contact_pipeline ON public.estimates;
CREATE TRIGGER trigger_update_contact_pipeline
AFTER INSERT OR UPDATE OF status ON public.estimates
FOR EACH ROW
EXECUTE FUNCTION public.update_contact_pipeline_on_estimate_status();
