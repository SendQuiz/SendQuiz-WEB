import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.writeHead(308, { Location: '/policy/terms-of-service/' });
  res.end();

  return { props: {} };
};

export default function PolicyPage() {
  return null;
}
